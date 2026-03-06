"""
Pydantic schemas for documents and versions.
"""
import uuid
from datetime import datetime

from pydantic import BaseModel, Field


# --- Request schemas ---

class DocumentCreateRequest(BaseModel):
    title: str = Field(default="Untitled", min_length=1, max_length=500)
    content: str = Field(default="")


class DocumentUpdateRequest(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=500)
    content: str | None = None
    commit_message: str | None = None


# --- Response schemas ---

class VersionResponse(BaseModel):
    id: uuid.UUID
    document_id: uuid.UUID
    version_number: int
    content: str
    author_id: uuid.UUID
    parent_version_id: uuid.UUID | None
    commit_message: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class DocumentResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    title: str
    current_version_id: uuid.UUID | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DocumentDetailResponse(DocumentResponse):
    content: str = ""  # Content from current version
    version_number: int = 0
    versions_count: int = 0


class DocumentListResponse(BaseModel):
    documents: list[DocumentResponse]
    total: int
