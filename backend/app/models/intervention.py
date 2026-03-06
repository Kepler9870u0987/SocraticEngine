"""
Intervention model — Log of philosophical crises (Socratica, Paradosso, Lenti).
Tracks every AI intervention with context, output, model used, and user reaction.
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Intervention(Base):
    __tablename__ = "interventions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    version_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("versions.id"), nullable=True, index=True
    )
    document_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("documents.id"), nullable=False, index=True
    )
    type: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # socratica, paradosso, lente_filosofica
    trigger_context: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )  # Text that triggered the intervention
    input_hash: Mapped[str | None] = mapped_column(
        String(64), nullable=True
    )  # SHA-256 of context sent to model
    output_json: Mapped[dict | None] = mapped_column(
        JSONB, nullable=True
    )  # Structured response from the model
    philosopher: Mapped[str | None] = mapped_column(
        String(100), nullable=True
    )  # NULL for Socratica/Paradosso, "Sartre" for Lenti
    model_used: Mapped[str | None] = mapped_column(
        String(100), nullable=True
    )  # e.g. "claude-sonnet-4-20250514", "gpt-4o"
    tokens_consumed: Mapped[int | None] = mapped_column(
        Integer, nullable=True
    )
    latency_ms: Mapped[int | None] = mapped_column(
        Integer, nullable=True
    )
    user_reaction: Mapped[str | None] = mapped_column(
        String(50), nullable=True
    )  # accepted, ignored, modified, rejected

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    version = relationship("Version", back_populates="interventions")
    document = relationship("Document", back_populates="interventions")

    def __repr__(self) -> str:
        return f"<Intervention {self.type} (doc={self.document_id})>"
