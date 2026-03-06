"""
Health check endpoints.
"""
from fastapi import APIRouter

router = APIRouter()


@router.get("")
async def health():
    """Detailed health check."""
    return {
        "status": "ok",
        "version": "0.1.0",
        "checks": {
            "api": "ok",
        }
    }
