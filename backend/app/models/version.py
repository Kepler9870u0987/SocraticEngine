"""
Version model — Git-like versioning for document content.
Each save creates a new version with a parent pointer, enabling tree-structured history.
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Version(Base):
    __tablename__ = "versions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    document_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("documents.id"), nullable=False, index=True
    )
    version_number: Mapped[int] = mapped_column(Integer, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False, default="")
    # Future: content_encrypted for E2EE
    encryption_key_id: Mapped[str | None] = mapped_column(
        String(255), nullable=True, default=None
    )
    author_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    parent_version_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("versions.id"), nullable=True, default=None
    )  # Git-like tree
    commit_message: Mapped[str | None] = mapped_column(
        Text, nullable=True, default=None
    )  # e.g. "Dopo intervento Socratico su assunzione X"

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    document = relationship("Document", back_populates="versions")
    interventions = relationship("Intervention", back_populates="version", lazy="noload")

    def __repr__(self) -> str:
        return f"<Version {self.version_number} (doc={self.document_id})>"
