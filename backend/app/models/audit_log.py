"""
AuditLog model — Centralized audit logging for all sensitive operations.
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import String, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )
    event_type: Mapped[str] = mapped_column(
        String(100), nullable=False, index=True
    )  # e.g. "auth.login", "document.access", "intervention.triggered"
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), nullable=True, index=True
    )
    resource_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )  # document_id, share_id, etc.
    action: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # create, read, update, delete, export, share, login, logout
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(Text, nullable=True)
    result: Mapped[str] = mapped_column(
        String(20), nullable=False, default="success"
    )  # success, failure, error
    metadata_json: Mapped[dict | None] = mapped_column(
        JSONB, nullable=True, default=None
    )  # Additional context

    def __repr__(self) -> str:
        return f"<AuditLog {self.event_type}:{self.action} at {self.timestamp}>"
