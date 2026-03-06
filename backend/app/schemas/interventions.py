"""
Pydantic schemas for AI interventions (Socratica, Paradosso, Lenti).
"""
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class InterventionType(str, Enum):
    SOCRATICA = "socratica"
    PARADOSSO = "paradosso"
    LENTE = "lente_filosofica"


class Philosopher(str, Enum):
    PLATONE = "Platone"
    ARISTOTELE = "Aristotele"
    KANT = "Kant"
    HEGEL = "Hegel"
    NIETZSCHE = "Nietzsche"
    HEIDEGGER = "Heidegger"
    FOUCAULT = "Foucault"
    WITTGENSTEIN = "Wittgenstein"


class UserReaction(str, Enum):
    ACCEPT = "accept"
    REJECT = "reject"
    IGNORE = "ignore"


class LLMProvider(str, Enum):
    ANTHROPIC = "anthropic"
    OPENAI = "openai"
    GEMINI = "gemini"


# ── Request schemas ────────────────────────────────────────────────────────────

class SocraticaRequest(BaseModel):
    document_id: str
    context: str = Field(..., min_length=10, max_length=8000,
                         description="Text excerpt to analyse (last ~500 words)")
    version_id: Optional[str] = None


class ParadossoRequest(BaseModel):
    document_id: str
    context: str = Field(..., min_length=20, max_length=8000)
    version_id: Optional[str] = None


class LenteRequest(BaseModel):
    document_id: str
    context: str = Field(..., min_length=20, max_length=4000,
                         description="Selected text to analyse")
    philosopher: Philosopher
    version_id: Optional[str] = None


class ReactionRequest(BaseModel):
    reaction: UserReaction


# ── Response schemas ───────────────────────────────────────────────────────────

class InterventionResponse(BaseModel):
    id: str
    document_id: str
    type: InterventionType
    philosopher: Optional[str] = None
    content: str
    model_used: str
    tokens_consumed: Optional[int] = None
    latency_ms: Optional[int] = None
    created_at: str

    model_config = {"from_attributes": True}


# ── WebSocket message schemas ──────────────────────────────────────────────────

class WsMessageType(str, Enum):
    # Client → Server
    TEXT_ACTIVITY = "text_activity"
    TRIGGER_SOCRATICA = "trigger_socratica"
    TRIGGER_PARADOSSO = "trigger_paradosso"
    TRIGGER_LENTE = "trigger_lente"
    ABORT = "abort"
    REACTION = "reaction"
    # Server → Client
    STREAM_START = "stream_start"
    STREAM_CHUNK = "stream_chunk"
    STREAM_END = "stream_end"
    ERROR = "error"
    ACK = "ack"
