"""
Document service — CRUD operations and versioning.
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.document import Document
from app.models.version import Version
from app.models.user import User
from app.schemas.documents import (
    DocumentCreateRequest,
    DocumentDetailResponse,
    DocumentListResponse,
    DocumentResponse,
    DocumentUpdateRequest,
    VersionResponse,
)


class DocumentService:
    """Handles document CRUD and versioning."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_document(
        self, user: User, data: DocumentCreateRequest
    ) -> DocumentDetailResponse:
        """Create a new document with initial version."""
        doc = Document(
            id=uuid.uuid4(),
            user_id=user.id,
            title=data.title,
        )
        self.db.add(doc)
        await self.db.flush()

        # Create initial version
        version = Version(
            id=uuid.uuid4(),
            document_id=doc.id,
            version_number=1,
            content=data.content,
            author_id=user.id,
            commit_message="Initial version",
        )
        self.db.add(version)
        await self.db.flush()

        # Set current version pointer
        doc.current_version_id = version.id
        await self.db.flush()

        return DocumentDetailResponse(
            id=doc.id,
            user_id=doc.user_id,
            title=doc.title,
            current_version_id=doc.current_version_id,
            created_at=doc.created_at,
            updated_at=doc.updated_at,
            content=version.content,
            version_number=version.version_number,
            versions_count=1,
        )

    async def list_documents(
        self, user: User, skip: int = 0, limit: int = 50
    ) -> DocumentListResponse:
        """List all documents for a user (excluding soft-deleted)."""
        query = (
            select(Document)
            .where(Document.user_id == user.id)
            .where(Document.deleted_at.is_(None))
            .order_by(Document.updated_at.desc())
            .offset(skip)
            .limit(limit)
        )
        result = await self.db.execute(query)
        documents = result.scalars().all()

        # Count total
        count_query = (
            select(func.count(Document.id))
            .where(Document.user_id == user.id)
            .where(Document.deleted_at.is_(None))
        )
        total = (await self.db.execute(count_query)).scalar() or 0

        return DocumentListResponse(
            documents=[DocumentResponse.model_validate(d) for d in documents],
            total=total,
        )

    async def get_document(
        self, user: User, document_id: uuid.UUID
    ) -> DocumentDetailResponse:
        """Get a document with its current version content."""
        doc = await self._get_user_document(user.id, document_id)

        # Get current version
        content = ""
        version_number = 0
        if doc.current_version_id:
            version_result = await self.db.execute(
                select(Version).where(Version.id == doc.current_version_id)
            )
            version = version_result.scalar_one_or_none()
            if version:
                content = version.content
                version_number = version.version_number

        # Count versions
        versions_count = (
            await self.db.execute(
                select(func.count(Version.id)).where(
                    Version.document_id == document_id
                )
            )
        ).scalar() or 0

        return DocumentDetailResponse(
            id=doc.id,
            user_id=doc.user_id,
            title=doc.title,
            current_version_id=doc.current_version_id,
            created_at=doc.created_at,
            updated_at=doc.updated_at,
            content=content,
            version_number=version_number,
            versions_count=versions_count,
        )

    async def update_document(
        self, user: User, document_id: uuid.UUID, data: DocumentUpdateRequest
    ) -> DocumentDetailResponse:
        """Update a document — creates new version if content changes."""
        doc = await self._get_user_document(user.id, document_id)

        # Update title if provided
        if data.title is not None:
            doc.title = data.title

        # If content changed, create new version
        new_version = None
        if data.content is not None:
            # Get current max version number
            max_version_result = await self.db.execute(
                select(func.max(Version.version_number)).where(
                    Version.document_id == document_id
                )
            )
            max_version = max_version_result.scalar() or 0

            new_version = Version(
                id=uuid.uuid4(),
                document_id=doc.id,
                version_number=max_version + 1,
                content=data.content,
                author_id=user.id,
                parent_version_id=doc.current_version_id,
                commit_message=data.commit_message or f"Version {max_version + 1}",
            )
            self.db.add(new_version)
            await self.db.flush()

            doc.current_version_id = new_version.id

        doc.updated_at = datetime.now(timezone.utc)
        await self.db.flush()

        # Build response
        content = ""
        version_number = 0
        if new_version:
            content = new_version.content
            version_number = new_version.version_number
        elif doc.current_version_id:
            version_result = await self.db.execute(
                select(Version).where(Version.id == doc.current_version_id)
            )
            v = version_result.scalar_one_or_none()
            if v:
                content = v.content
                version_number = v.version_number

        versions_count = (
            await self.db.execute(
                select(func.count(Version.id)).where(
                    Version.document_id == document_id
                )
            )
        ).scalar() or 0

        return DocumentDetailResponse(
            id=doc.id,
            user_id=doc.user_id,
            title=doc.title,
            current_version_id=doc.current_version_id,
            created_at=doc.created_at,
            updated_at=doc.updated_at,
            content=content,
            version_number=version_number,
            versions_count=versions_count,
        )

    async def delete_document(
        self, user: User, document_id: uuid.UUID
    ) -> None:
        """Soft-delete a document."""
        doc = await self._get_user_document(user.id, document_id)
        doc.deleted_at = datetime.now(timezone.utc)
        await self.db.flush()

    async def list_versions(
        self, user: User, document_id: uuid.UUID
    ) -> list[VersionResponse]:
        """List all versions for a document."""
        await self._get_user_document(user.id, document_id)

        result = await self.db.execute(
            select(Version)
            .where(Version.document_id == document_id)
            .order_by(Version.version_number.desc())
        )
        versions = result.scalars().all()
        return [VersionResponse.model_validate(v) for v in versions]

    async def get_version(
        self, user: User, document_id: uuid.UUID, version_id: uuid.UUID
    ) -> VersionResponse:
        """Get a specific version."""
        await self._get_user_document(user.id, document_id)

        result = await self.db.execute(
            select(Version).where(
                Version.id == version_id,
                Version.document_id == document_id,
            )
        )
        version = result.scalar_one_or_none()
        if version is None:
            raise ValueError("Version not found")
        return VersionResponse.model_validate(version)

    async def rollback_to_version(
        self, user: User, document_id: uuid.UUID, version_id: uuid.UUID
    ) -> DocumentDetailResponse:
        """Rollback document to a specific version by creating a new version with the old content."""
        doc = await self._get_user_document(user.id, document_id)

        # Get the target version
        result = await self.db.execute(
            select(Version).where(
                Version.id == version_id,
                Version.document_id == document_id,
            )
        )
        target_version = result.scalar_one_or_none()
        if target_version is None:
            raise ValueError("Version not found")

        # Create new version with content from target
        max_version_result = await self.db.execute(
            select(func.max(Version.version_number)).where(
                Version.document_id == document_id
            )
        )
        max_version = max_version_result.scalar() or 0

        new_version = Version(
            id=uuid.uuid4(),
            document_id=doc.id,
            version_number=max_version + 1,
            content=target_version.content,
            author_id=user.id,
            parent_version_id=doc.current_version_id,
            commit_message=f"Rollback to version {target_version.version_number}",
        )
        self.db.add(new_version)
        await self.db.flush()

        doc.current_version_id = new_version.id
        doc.updated_at = datetime.now(timezone.utc)
        await self.db.flush()

        versions_count = (
            await self.db.execute(
                select(func.count(Version.id)).where(
                    Version.document_id == document_id
                )
            )
        ).scalar() or 0

        return DocumentDetailResponse(
            id=doc.id,
            user_id=doc.user_id,
            title=doc.title,
            current_version_id=doc.current_version_id,
            created_at=doc.created_at,
            updated_at=doc.updated_at,
            content=new_version.content,
            version_number=new_version.version_number,
            versions_count=versions_count,
        )

    # --- Private helpers ---

    async def _get_user_document(
        self, user_id: uuid.UUID, document_id: uuid.UUID
    ) -> Document:
        """Get a document ensuring it belongs to the user and is not deleted."""
        result = await self.db.execute(
            select(Document).where(
                Document.id == document_id,
                Document.user_id == user_id,
                Document.deleted_at.is_(None),
            )
        )
        doc = result.scalar_one_or_none()
        if doc is None:
            raise ValueError("Document not found")
        return doc
