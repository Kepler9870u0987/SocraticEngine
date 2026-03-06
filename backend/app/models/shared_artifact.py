"""
SharedArtifact model — Interactive public share links with client-side decryption.
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import Integer, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class SharedArtifact(Base):
    __tablename__ = "shared_artifacts"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    document_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("documents.id"), nullable=False, index=True
    )
    version_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("versions.id"), nullable=False
    )
    share_token: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False, index=True
    )
    encrypted_content: Mapped[str | None] = mapped_column(
        String, nullable=True
    )  # Content re-encrypted with share-specific key K
    expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    max_views: Mapped[int | None] = mapped_column(
        Integer, nullable=True, default=None
    )  # NULL = unlimited
    view_count: Mapped[int] = mapped_column(
        Integer, default=0, nullable=False
    )
    created_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    revoked_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, default=None
    )  # For manual revocation

    # Relationships
    document = relationship("Document", back_populates="shared_artifacts")

    @property
    def is_revoked(self) -> bool:
        return self.revoked_at is not None

    @property
    def is_expired(self) -> bool:
        if self.expires_at is None:
            return False
        return datetime.now(timezone.utc) > self.expires_at

    @property
    def views_exhausted(self) -> bool:
        if self.max_views is None:
            return False
        return self.view_count >= self.max_views

    def __repr__(self) -> str:
        return f"<SharedArtifact {self.share_token} (doc={self.document_id})>"
