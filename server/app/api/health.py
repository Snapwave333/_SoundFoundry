"""
Health check endpoint
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, Optional
import os
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


class HealthResponse(BaseModel):
    status: str
    version: str


class ProviderHealthResponse(BaseModel):
    fal: str
    replicate: str
    fal_error: Optional[str] = None
    replicate_error: Optional[str] = None


@router.get("/health", response_model=HealthResponse)
async def health_check():
    return {"status": "ok", "version": "1.0.0"}


@router.get("/health/providers", response_model=ProviderHealthResponse)
async def provider_health():
    """Check provider availability"""
    fal_status = "ok"
    fal_error = None
    replicate_status = "ok"
    replicate_error = None
    
    # Check FAL
    try:
        from app.services.fal_provider import FALProvider
        provider = FALProvider()
        fal_status = "ok"
    except Exception as e:
        fal_status = "fail"
        fal_error = str(e)
        logger.warning(f"FAL provider check failed: {e}")
    
    # Check Replicate
    try:
        from app.services.replicate_provider import ReplicateProvider
        provider = ReplicateProvider()
        replicate_status = "ok"
    except Exception as e:
        replicate_status = "fail"
        replicate_error = str(e)
        logger.warning(f"Replicate provider check failed: {e}")
    
    return {
        "fal": fal_status,
        "replicate": replicate_status,
        "fal_error": fal_error,
        "replicate_error": replicate_error,
    }
