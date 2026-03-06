"""
Main API router — aggregates all sub-routers.
"""
from fastapi import APIRouter

from app.api.endpoints import auth, documents, health

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(documents.router, prefix="/documents", tags=["Documents"])
api_router.include_router(health.router, prefix="/health", tags=["Health"])
