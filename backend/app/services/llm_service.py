"""
LLM Service — multi-provider streaming abstraction.

Supports: Anthropic (Claude), OpenAI (GPT), Google (Gemini).
Each method returns an AsyncIterator[str] of streaming chunks.

Routing logic:
  - socratica_simple  → Anthropic claude-haiku / Gemini flash / GPT-4o-mini
  - socratica_deep    → Anthropic claude-sonnet / Gemini pro / GPT-4o
  - paradosso         → Anthropic claude-sonnet
  - lente             → Anthropic claude-sonnet
  - fallback chain    → Anthropic → OpenAI → Gemini
"""
from __future__ import annotations

import asyncio
import logging
import time
from typing import AsyncIterator, Optional

from app.core.config import settings

log = logging.getLogger(__name__)


# ── Routing table ──────────────────────────────────────────────────────────────

ROUTING: dict[str, tuple[str, str]] = {
    # (provider, model)
    "socratica_simple": ("anthropic", settings.ANTHROPIC_HAIKU_MODEL),
    "socratica_deep":   ("anthropic", settings.ANTHROPIC_DEFAULT_MODEL),
    "paradosso":        ("anthropic", settings.ANTHROPIC_DEFAULT_MODEL),
    "lente":            ("anthropic", settings.ANTHROPIC_DEFAULT_MODEL),
    "monitor":          ("openai",    settings.OPENAI_DEFAULT_MODEL),
}


def choose_route(feature: str, context_length: int) -> tuple[str, str]:
    """Return (provider, model) for the given feature.

    Uses 'simple' path for short contexts to save cost.
    """
    if feature == "socratica" and context_length < 500:
        key = "socratica_simple"
    else:
        key = f"{feature}_deep" if f"{feature}_deep" in ROUTING else feature

    if key not in ROUTING:
        key = "socratica_deep"

    # Override with primary provider if configured
    provider, model = ROUTING[key]
    if settings.LLM_PRIMARY_PROVIDER == "gemini" and settings.GEMINI_API_KEY:
        if feature in ("socratica", "lente"):
            return ("gemini", settings.GEMINI_FAST_MODEL)
        return ("gemini", settings.GEMINI_HEAVY_MODEL)
    if settings.LLM_PRIMARY_PROVIDER == "openai" and settings.OPENAI_API_KEY:
        if feature in ("socratica", "lente"):
            return ("openai", settings.OPENAI_DEFAULT_MODEL)
        return ("openai", settings.OPENAI_HEAVY_MODEL)

    return (provider, model)


# ── Provider implementations ───────────────────────────────────────────────────

async def _stream_anthropic(
    model: str,
    system: str,
    user: str,
    max_tokens: int = 512,
) -> AsyncIterator[str]:
    """Stream tokens from Anthropic Claude."""
    import anthropic

    client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
    async with client.messages.stream(
        model=model,
        max_tokens=max_tokens,
        system=system,
        messages=[{"role": "user", "content": user}],
    ) as stream:
        async for text in stream.text_stream:
            yield text


async def _stream_openai(
    model: str,
    system: str,
    user: str,
    max_tokens: int = 512,
) -> AsyncIterator[str]:
    """Stream tokens from OpenAI."""
    from openai import AsyncOpenAI

    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    stream = await client.chat.completions.create(
        model=model,
        max_tokens=max_tokens,
        stream=True,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
    )
    async for chunk in stream:
        delta = chunk.choices[0].delta.content
        if delta:
            yield delta


async def _stream_gemini(
    model: str,
    system: str,
    user: str,
    max_tokens: int = 512,
) -> AsyncIterator[str]:
    """Stream tokens from Google Gemini (google-genai SDK)."""
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=settings.GEMINI_API_KEY)
    async for chunk in await client.aio.models.generate_content_stream(
        model=model,
        contents=user,
        config=types.GenerateContentConfig(
            system_instruction=system,
            max_output_tokens=max_tokens,
            temperature=0.7,
            # Disable thinking for faster, token-efficient streaming responses
            thinking_config=types.ThinkingConfig(thinking_budget=0),
        ),
    ):
        if chunk.text:
            yield chunk.text


# ── Public API ─────────────────────────────────────────────────────────────────

class LLMService:
    """
    Entry point for all LLM calls.

    Usage:
        async for chunk in LLMService.stream("socratica", system_prompt, user_prompt):
            ...

    Returns (token_iterator, provider_used, model_used).
    Uses fallback chain on provider errors.
    """

    @staticmethod
    async def stream(
        feature: str,
        system: str,
        user: str,
        max_tokens: int = 512,
    ) -> tuple[AsyncIterator[str], str, str]:
        """
        Returns (async_iterator, provider, model).
        Falls back across providers on errors.
        """
        provider, model = choose_route(feature, len(user))

        # Build fallback chain based on which API keys are available
        chain: list[tuple[str, str]] = [(provider, model)]
        fallbacks = [
            ("anthropic", settings.ANTHROPIC_DEFAULT_MODEL),
            ("openai",    settings.OPENAI_DEFAULT_MODEL),
            ("gemini",    settings.GEMINI_FAST_MODEL),
        ]
        for p, m in fallbacks:
            if (p, m) not in chain:
                chain.append((p, m))

        # Filter to only providers with configured API keys
        def has_key(p: str) -> bool:
            if p == "anthropic":
                return bool(settings.ANTHROPIC_API_KEY)
            if p == "openai":
                return bool(settings.OPENAI_API_KEY)
            if p == "gemini":
                return bool(settings.GEMINI_API_KEY)
            return False

        chain = [(p, m) for p, m in chain if has_key(p)]

        if not chain:
            raise RuntimeError(
                "No LLM provider configured. Set at least one of: "
                "ANTHROPIC_API_KEY, OPENAI_API_KEY, GEMINI_API_KEY"
            )

        # Return a safe wrapper that tries each provider in sequence.
        # We must wrap because async generators throw only when iterated,
        # not when constructed — so try/except around _make_iterator() is not enough.

        async def _with_fallback() -> AsyncIterator[str]:
            for prov, mod in chain:
                try:
                    async for chunk in _make_iterator(prov, mod, system, user, max_tokens):
                        yield chunk
                    return  # success — stop after first working provider
                except Exception as exc:
                    log.warning("LLM provider %s/%s failed: %s", prov, mod, exc)
            raise RuntimeError("All LLM providers failed.")

        used_provider, used_model = chain[0]
        return _with_fallback(), used_provider, used_model

    @staticmethod
    async def complete(
        feature: str,
        system: str,
        user: str,
        max_tokens: int = 512,
    ) -> tuple[str, str, str, int]:
        """
        Blocking (non-streaming) call. Returns (text, provider, model, latency_ms).
        """
        start = time.monotonic()
        iterator, provider, model = await LLMService.stream(feature, system, user, max_tokens)
        chunks: list[str] = []
        async for chunk in iterator:
            chunks.append(chunk)
        latency_ms = int((time.monotonic() - start) * 1000)
        return "".join(chunks), provider, model, latency_ms


def _make_iterator(
    provider: str,
    model: str,
    system: str,
    user: str,
    max_tokens: int,
) -> AsyncIterator[str]:
    if provider == "anthropic":
        return _stream_anthropic(model, system, user, max_tokens)
    if provider == "openai":
        return _stream_openai(model, system, user, max_tokens)
    if provider == "gemini":
        return _stream_gemini(model, system, user, max_tokens)
    raise ValueError(f"Unknown provider: {provider}")
