"""
Document endpoints — CRUD operations and version management.
"""
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.documents import (
    DocumentCreateRequest,
    DocumentDetailResponse,
    DocumentListResponse,
    DocumentUpdateRequest,
    VersionResponse,
)
from app.services.document_service import DocumentService

router = APIRouter()


@router.post("", response_model=DocumentDetailResponse, status_code=status.HTTP_201_CREATED)
async def create_document(
    data: DocumentCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new document."""
    service = DocumentService(db)
    return await service.create_document(current_user, data)


@router.get("", response_model=DocumentListResponse)
async def list_documents(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List user's documents."""
    service = DocumentService(db)
    return await service.list_documents(current_user, skip=skip, limit=limit)


@router.get("/{document_id}", response_model=DocumentDetailResponse)
async def get_document(
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a document with current version content."""
    service = DocumentService(db)
    try:
        return await service.get_document(current_user, document_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.put("/{document_id}", response_model=DocumentDetailResponse)
async def update_document(
    document_id: uuid.UUID,
    data: DocumentUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a document (creates new version if content changes)."""
    service = DocumentService(db)
    try:
        return await service.update_document(current_user, document_id, data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Soft-delete a document."""
    service = DocumentService(db)
    try:
        await service.delete_document(current_user, document_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


# --- Version endpoints ---

@router.get("/{document_id}/versions", response_model=list[VersionResponse])
async def list_versions(
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all versions of a document."""
    service = DocumentService(db)
    try:
        return await service.list_versions(current_user, document_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.get("/{document_id}/versions/{version_id}", response_model=VersionResponse)
async def get_version(
    document_id: uuid.UUID,
    version_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific version of a document."""
    service = DocumentService(db)
    try:
        return await service.get_version(current_user, document_id, version_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post(
    "/{document_id}/versions/{version_id}/rollback",
    response_model=DocumentDetailResponse,
)
async def rollback_to_version(
    document_id: uuid.UUID,
    version_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Rollback document to a specific version."""
    service = DocumentService(db)
    try:
        return await service.rollback_to_version(current_user, document_id, version_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
