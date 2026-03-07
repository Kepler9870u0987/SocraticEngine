"""
REST endpoints for AI interventions.

POST /api/interventions/socratica  — Voce Socratica (blocking, returns full content)
POST /api/interventions/paradosso  — Paradosso (blocking)
POST /api/interventions/lente      — Lente Filosofica (blocking)
GET  /api/interventions/{document_id}  — list interventions for a document
POST /api/interventions/{intervention_id}/reaction — user reacts to an intervention
"""
from __future__ import annotations

import time
import uuid
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.intervention import Intervention
from app.models.document import Document
from app.schemas.interventions import (
    InterventionResponse,
    LenteRequest,
    ParadossoRequest,
    ReactionRequest,
    SocraticaRequest,
)
from app.services.intervention_service import InterventionService

router = APIRouter()

PARADOSSO_COOLDOWN_S = 300  # 5 minutes


async def _assert_document_access(
    document_id: str,
    user_id: str,
    db: AsyncSession,
) -> Document:
    result = await db.execute(
        select(Document).where(
            Document.id == document_id,
            Document.user_id == user_id,
            Document.deleted_at.is_(None),
        )
    )
    doc = result.scalar_one_or_none()
    if doc is None:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


def _to_response(obj: Intervention) -> InterventionResponse:
    return InterventionResponse(
        id=str(obj.id),
        document_id=str(obj.document_id),
        type=obj.type,
        philosopher=obj.philosopher,
        content=obj.output_json.get("content", "") if obj.output_json else "",
        model_used=obj.model_used or "",
        tokens_consumed=obj.tokens_consumed,
        latency_ms=obj.latency_ms,
        created_at=obj.created_at.isoformat() if obj.created_at else "",
    )


# ── Voce Socratica ─────────────────────────────────────────────────────────────

@router.post("/socratica", response_model=InterventionResponse, status_code=201)
async def trigger_socratica(
    body: SocraticaRequest,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Trigger a Socratic intervention (blocking, returns full response)."""
    await _assert_document_access(body.document_id, str(user.id), db)

    content, provider, model_used, latency_ms = await InterventionService.complete_socratica(
        body.context
    )

    obj = Intervention(
        id=str(uuid.uuid4()),
        document_id=body.document_id,
        type="socratica",
        output_json={"content": content},
        model_used=f"{provider}/{model_used}",
        latency_ms=latency_ms,
    )
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return _to_response(obj)


# ── Paradosso ──────────────────────────────────────────────────────────────────

@router.post("/paradosso", response_model=InterventionResponse, status_code=201)
async def trigger_paradosso(
    body: ParadossoRequest,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Trigger a Paradosso intervention (blocking)."""
    await _assert_document_access(body.document_id, str(user.id), db)

    # ── Cooldown check ────────────────────────────────────────────
    cutoff = datetime.now(timezone.utc) - timedelta(seconds=PARADOSSO_COOLDOWN_S)
    recent = await db.execute(
        select(Intervention.created_at)
        .where(
            Intervention.document_id == body.document_id,
            Intervention.type == "paradosso",
            Intervention.created_at >= cutoff,
        )
        .order_by(Intervention.created_at.desc())
        .limit(1)
    )
    last_paradosso = recent.scalar_one_or_none()
    if last_paradosso is not None:
        elapsed = (datetime.now(timezone.utc) - last_paradosso).total_seconds()
        remaining = int(PARADOSSO_COOLDOWN_S - elapsed)
        if remaining > 0:
            raise HTTPException(
                status_code=429,
                detail=f"Paradosso in cooldown — attendi {remaining}s",
            )

    content, provider, model_used, latency_ms = await InterventionService.complete_paradosso(
        body.context
    )

    obj = Intervention(
        id=str(uuid.uuid4()),
        document_id=body.document_id,
        type="paradosso",
        output_json={"content": content},
        model_used=f"{provider}/{model_used}",
        latency_ms=latency_ms,
    )
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return _to_response(obj)


# ── Lenti Filosofiche ──────────────────────────────────────────────────────────

@router.post("/lente", response_model=InterventionResponse, status_code=201)
async def trigger_lente(
    body: LenteRequest,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Trigger a Lente Filosofica intervention (blocking)."""
    await _assert_document_access(body.document_id, str(user.id), db)

    content, provider, model_used, latency_ms = await InterventionService.complete_lente(
        body.context, body.philosopher
    )

    obj = Intervention(
        id=str(uuid.uuid4()),
        document_id=body.document_id,
        type="lente_filosofica",
        philosopher=body.philosopher.value,
        output_json={"content": content},
        model_used=f"{provider}/{model_used}",
        latency_ms=latency_ms,
    )
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return _to_response(obj)


# ── List interventions for document ───────────────────────────────────────────

@router.get("/{document_id}", response_model=list[InterventionResponse])
async def list_interventions(
    document_id: str,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all interventions for a document (most recent first)."""
    await _assert_document_access(document_id, str(user.id), db)

    result = await db.execute(
        select(Intervention)
        .where(Intervention.document_id == document_id)
        .order_by(Intervention.created_at.desc())
        .limit(50)
    )
    rows = result.scalars().all()
    return [_to_response(r) for r in rows]


# ── User reaction ──────────────────────────────────────────────────────────────

@router.post("/{intervention_id}/reaction", response_model=InterventionResponse)
async def set_reaction(
    intervention_id: str,
    body: ReactionRequest,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Record the user's reaction (accept / reject / ignore)."""
    result = await db.execute(
        select(Intervention).where(Intervention.id == intervention_id)
    )
    obj = result.scalar_one_or_none()
    if obj is None:
        raise HTTPException(status_code=404, detail="Intervention not found")

    # Verify ownership via document
    await _assert_document_access(str(obj.document_id), str(user.id), db)

    obj.user_reaction = body.reaction.value
    await db.commit()
    await db.refresh(obj)
    return _to_response(obj)
