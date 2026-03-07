"""
WebSocket endpoint for real-time AI interventions.

ws://host/api/ws/{document_id}?token=<JWT>

Client messages (JSON):
  {"type": "text_activity"}                              # typing → reset debounce
  {"type": "trigger_socratica", "context": "..."}        # manual / auto after 3s
  {"type": "trigger_paradosso", "context": "..."}
  {"type": "trigger_lente", "context": "...", "philosopher": "Foucault"}
  {"type": "abort"}                                      # cancel stream
  {"type": "reaction", "intervention_id": "...", "reaction": "accept"}

Server messages (JSON):
  {"type": "ack"}
  {"type": "stream_start", "intervention_type": "...", "intervention_id": "..."}
  {"type": "stream_chunk", "content": "...", "intervention_id": "..."}
  {"type": "stream_end",   "intervention_id": "...", "model_used": "..."}
  {"type": "error", "message": "..."}
"""
from __future__ import annotations

import asyncio
import json
import logging
import time
import uuid
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user_ws
from app.api.ws_manager import manager
from app.core.database import async_session_maker
from app.models.intervention import Intervention
from app.schemas.interventions import Philosopher, WsMessageType
from app.services.intervention_service import InterventionService

router = APIRouter()
log = logging.getLogger(__name__)

SOCRATICA_DEBOUNCE_S = 3.0  # seconds of silence before auto-trigger
PARADOSSO_COOLDOWN_S = 300  # 5 minutes cooldown between paradox triggers per document


@router.websocket("/ws/{document_id}")
async def websocket_endpoint(ws: WebSocket, document_id: str) -> None:
    """Main real-time WebSocket endpoint."""
    # --- Authenticate via query param token ----------------------------------
    token = ws.query_params.get("token")
    user = await get_current_user_ws(token)
    if user is None:
        await ws.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await manager.connect(ws, document_id, str(user.id))
    _debounce_task: asyncio.Task | None = None

    try:
        while True:
            raw = await ws.receive_text()
            try:
                msg = json.loads(raw)
            except json.JSONDecodeError:
                await _send(ws, {"type": WsMessageType.ERROR,
                                 "message": "Invalid JSON"})
                continue

            msg_type = msg.get("type")

            # ── typing activity: reset debounce ──────────────────────────────
            if msg_type == WsMessageType.TEXT_ACTIVITY:
                if _debounce_task and not _debounce_task.done():
                    _debounce_task.cancel()
                context = msg.get("context", "")
                if context.strip():
                    _debounce_task = asyncio.create_task(
                        _debounced_socratica(ws, document_id, user, context)
                    )
                await _send(ws, {"type": WsMessageType.ACK})

            # ── manual socratica ─────────────────────────────────────────────
            elif msg_type == WsMessageType.TRIGGER_SOCRATICA:
                await manager.abort(document_id, str(user.id))
                context = msg.get("context", "")
                task = asyncio.create_task(
                    _stream_intervention(ws, document_id, user,
                                        "socratica", context)
                )
                manager.register_task(document_id, str(user.id), task)

            # ── paradosso ────────────────────────────────────────────────────
            elif msg_type == WsMessageType.TRIGGER_PARADOSSO:
                # Check cooldown
                cooldown_remaining = await _check_paradosso_cooldown(document_id)
                if cooldown_remaining > 0:
                    await _send(ws, {
                        "type": "cooldown",
                        "intervention_type": "paradosso",
                        "remaining_seconds": cooldown_remaining,
                        "message": f"Paradosso in cooldown — attendi {cooldown_remaining}s",
                    })
                else:
                    await manager.abort(document_id, str(user.id))
                    context = msg.get("context", "")
                    task = asyncio.create_task(
                        _stream_intervention(ws, document_id, user,
                                            "paradosso", context)
                    )
                    manager.register_task(document_id, str(user.id), task)

            # ── lente filosofica ─────────────────────────────────────────────
            elif msg_type == WsMessageType.TRIGGER_LENTE:
                await manager.abort(document_id, str(user.id))
                context = msg.get("context", "")
                selected_text = msg.get("selected_text", "")
                philosopher_raw = msg.get("philosopher", "platone")
                try:
                    philosopher = Philosopher(philosopher_raw)
                except ValueError:
                    philosopher = Philosopher.PLATONE
                task = asyncio.create_task(
                    _stream_intervention(ws, document_id, user,
                                        "lente_filosofica", context, philosopher,
                                        selected_text=selected_text)
                )
                manager.register_task(document_id, str(user.id), task)

            # ── abort ────────────────────────────────────────────────────────
            elif msg_type == WsMessageType.ABORT:
                if _debounce_task and not _debounce_task.done():
                    _debounce_task.cancel()
                await manager.abort(document_id, str(user.id))
                await _send(ws, {"type": WsMessageType.ACK})

            else:
                await _send(ws, {"type": WsMessageType.ERROR,
                                 "message": f"Unknown message type: {msg_type}"})

    except WebSocketDisconnect:
        pass
    finally:
        if _debounce_task and not _debounce_task.done():
            _debounce_task.cancel()
        await manager.abort(document_id, str(user.id))
        manager.disconnect(document_id, str(user.id))


# ── Helpers ────────────────────────────────────────────────────────────────────

async def _check_paradosso_cooldown(document_id: str) -> int:
    """Check if a paradox cooldown is active for this document.

    Returns remaining seconds (0 if no cooldown active).
    """
    try:
        async with async_session_maker() as session:
            cutoff = datetime.now(timezone.utc) - timedelta(seconds=PARADOSSO_COOLDOWN_S)
            result = await session.execute(
                select(Intervention.created_at)
                .where(
                    Intervention.document_id == document_id,
                    Intervention.type == "paradosso",
                    Intervention.created_at >= cutoff,
                )
                .order_by(Intervention.created_at.desc())
                .limit(1)
            )
            last = result.scalar_one_or_none()
            if last is None:
                return 0
            elapsed = (datetime.now(timezone.utc) - last).total_seconds()
            remaining = int(PARADOSSO_COOLDOWN_S - elapsed)
            return max(0, remaining)
    except Exception as exc:
        log.warning("Cooldown check failed: %s", exc)
        return 0  # fail open

async def _debounced_socratica(
    ws: WebSocket,
    document_id: str,
    user,
    context: str,
) -> None:
    """Wait DEBOUNCE seconds, then trigger automatic Socratica."""
    try:
        await asyncio.sleep(SOCRATICA_DEBOUNCE_S)
        task = asyncio.create_task(
            _stream_intervention(ws, document_id, user, "socratica", context)
        )
        manager.register_task(document_id, str(user.id), task)
    except asyncio.CancelledError:
        pass


async def _stream_intervention(
    ws: WebSocket,
    document_id: str,
    user,
    int_type: str,
    context: str,
    philosopher: Philosopher | None = None,
    selected_text: str = "",
) -> None:
    """Stream an intervention to the client and persist it in the DB."""
    if not context.strip():
        return

    intervention_id = str(uuid.uuid4())
    start = time.monotonic()
    full_content: list[str] = []
    provider = ""
    model_used = ""

    try:
        await _send(ws, {
            "type": WsMessageType.STREAM_START,
            "intervention_type": int_type,
            "intervention_id": intervention_id,
        })

        # Choose the right service method
        if int_type == "paradosso":
            iterator, provider, model_used = await InterventionService.paradosso(context)
        elif int_type == "lente_filosofica" and philosopher:
            iterator, provider, model_used = await InterventionService.lente(
                context, philosopher, selected_text=selected_text
            )
        else:
            iterator, provider, model_used = await InterventionService.socratica(context)

        async for chunk in iterator:
            full_content.append(chunk)
            await _send(ws, {
                "type": WsMessageType.STREAM_CHUNK,
                "content": chunk,
                "intervention_id": intervention_id,
            })

        latency_ms = int((time.monotonic() - start) * 1000)
        full_text = "".join(full_content)

        await _send(ws, {
            "type": WsMessageType.STREAM_END,
            "intervention_id": intervention_id,
            "model_used": model_used,
            "provider": provider,
            "latency_ms": latency_ms,
        })

        # Persist to DB
        await _persist_intervention(
            document_id=document_id,
            user_id=str(user.id),
            intervention_id=intervention_id,
            int_type=int_type,
            philosopher=philosopher.value if philosopher else None,
            content=full_text,
            model_used=model_used,
            provider=provider,
            latency_ms=latency_ms,
        )

    except asyncio.CancelledError:
        await _send(ws, {
            "type": WsMessageType.ERROR,
            "message": "Generazione interrotta dall'autore.",
            "intervention_id": intervention_id,
        })
    except Exception as exc:
        log.exception("Intervention stream error: %s", exc)
        await _send(ws, {
            "type": WsMessageType.ERROR,
            "message": f"Errore durante la generazione: {exc}",
            "intervention_id": intervention_id,
        })


async def _send(ws: WebSocket, data: dict) -> None:
    """Send JSON, ignoring closed-connection errors."""
    try:
        await ws.send_json(data)
    except Exception:
        pass


async def _persist_intervention(
    document_id: str,
    user_id: str,
    intervention_id: str,
    int_type: str,
    philosopher: str | None,
    content: str,
    model_used: str,
    provider: str,
    latency_ms: int,
) -> None:
    """Persist intervention to the database (fire-and-forget)."""
    try:
        from app.models.intervention import Intervention  # local import avoids circular
        async with async_session_maker() as session:
            obj = Intervention(
                id=intervention_id,
                document_id=document_id,
                type=int_type,
                trigger_context=None,  # privacy: don't store raw input
                philosopher=philosopher,
                output_json={"content": content},
                model_used=f"{provider}/{model_used}",
                latency_ms=latency_ms,
            )
            session.add(obj)
            await session.commit()
    except Exception as exc:
        log.warning("Failed to persist intervention: %s", exc)
