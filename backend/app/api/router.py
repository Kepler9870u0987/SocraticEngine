"""
Main API router — aggregates all sub-routers.
"""
from fastapi import APIRouter

from app.api.endpoints import auth, documents, health, interventions
from app.api.endpoints import ws

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(documents.router, prefix="/documents", tags=["Documents"])
api_router.include_router(health.router, prefix="/health", tags=["Health"])
api_router.include_router(interventions.router, prefix="/interventions",
                           tags=["Interventions"])
api_router.include_router(ws.router, tags=["WebSocket"])
