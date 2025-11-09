"""
Style system API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
import re
from datetime import datetime

from app.database import get_db
from app.models.user import User
from app.models.series import Series
from app.models.track import Track
from app.utils.style_seed import (
    get_or_create_style_seed,
    update_user_unlocks,
    compute_style_unlocks,
)

router = APIRouter()


# Feature flags
STYLE_SEED_ENABLED = True
STYLE_UNLOCKS_ENABLED = True
STYLE_SERIES_ENABLED = True


# Pydantic models
class SeriesCreate(BaseModel):
    title: str
    palette: Optional[dict] = None
    geometry: Optional[dict] = None


class SeriesUpdate(BaseModel):
    title: Optional[str] = None
    palette: Optional[dict] = None
    geometry: Optional[dict] = None


class SeriesResponse(BaseModel):
    id: int
    user_id: int
    title: str
    slug: str
    palette: dict
    geometry: dict
    created_at: str

    class Config:
        from_attributes = True


class UnlocksResponse(BaseModel):
    unlocks: List[str]


def slugify(text: str) -> str:
    """Convert text to URL-safe slug"""
    slug = re.sub(r'[^\w\s-]', '', text.lower())
    slug = re.sub(r'[-\s]+', '-', slug)
    return slug.strip('-')


def get_default_series_palette(user_style_seed: int) -> dict:
    """Generate default palette from user style seed"""
    # Use seed to pick base hue (0-360)
    hue = user_style_seed % 360
    # Secondary hue offset
    hue2 = (hue + 60 + (user_style_seed >> 8) % 60) % 360
    
    return {
        "primary_hue": hue,
        "secondary_hue": hue2,
        "luminance_base": 0.45,
        "saturation": 0.8,
    }


def get_default_series_geometry(user_style_seed: int) -> dict:
    """Generate default geometry from user style seed"""
    return {
        "stroke_width_base": 8 + (user_style_seed % 16),
        "rotation_base": (user_style_seed >> 16) % 360,
        "gradient_angle": (user_style_seed >> 8) % 90,
        "shape_count": 6,
    }


def get_current_user(db: Session = Depends(get_db)) -> User:
    """Get current user - TODO: Replace with actual auth"""
    # For now, return first user (replace with auth middleware)
    user = db.query(User).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get("/me", response_model=dict)
async def get_user_style_info(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get user style seed and unlocks"""
    if not STYLE_SEED_ENABLED:
        return {"user_style_seed": None, "style_unlocks": []}
    
    # Ensure style seed exists
    style_seed = get_or_create_style_seed(user)
    if user.user_style_seed is None:
        user.user_style_seed = style_seed
        db.commit()
    
    return {
        "user_style_seed": style_seed,
        "style_unlocks": user.style_unlocks or [],
    }


@router.get("/unlocks", response_model=UnlocksResponse)
async def get_unlocks(
    user: User = Depends(get_current_user),
):
    """Get user style unlocks"""
    if not STYLE_UNLOCKS_ENABLED:
        return UnlocksResponse(unlocks=[])
    
    return UnlocksResponse(unlocks=user.style_unlocks or [])


@router.post("/unlocks/recompute")
async def recompute_unlocks(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Recompute and update user unlocks (admin/dev endpoint)"""
    if not STYLE_UNLOCKS_ENABLED:
        return UnlocksResponse(unlocks=[])
    
    updated_unlocks = update_user_unlocks(user.id, db)
    
    # Emit telemetry event
    from app.middleware.observability import emit_event
    emit_event("unlocks.updated", {
        "user_id": user.id,
        "unlocks": updated_unlocks,
    })
    
    return UnlocksResponse(unlocks=updated_unlocks)


@router.post("/series", response_model=SeriesResponse, status_code=status.HTTP_201_CREATED)
async def create_series(
    series_data: SeriesCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new series"""
    if not STYLE_SERIES_ENABLED:
        raise HTTPException(status_code=503, detail="Series feature disabled")
    
    # Ensure style seed exists
    style_seed = get_or_create_style_seed(user)
    if user.user_style_seed is None:
        user.user_style_seed = style_seed
        db.commit()
    
    # Generate slug
    base_slug = slugify(series_data.title)
    slug = base_slug
    counter = 1
    while db.query(Series).filter(Series.slug == slug).first():
        slug = f"{base_slug}-{counter}"
        counter += 1
    
    # Use provided palette/geometry or generate defaults
    palette = series_data.palette or get_default_series_palette(style_seed)
    geometry = series_data.geometry or get_default_series_geometry(style_seed)
    
    series = Series(
        user_id=user.id,
        title=series_data.title,
        slug=slug,
        palette=palette,
        geometry=geometry,
    )
    
    db.add(series)
    db.commit()
    db.refresh(series)
    
    # Emit telemetry event
    from app.middleware.observability import emit_event
    emit_event("series.created", {
        "series_id": series.id,
        "user_id": user.id,
        "title": series.title,
    })
    
    return SeriesResponse(
        id=series.id,
        user_id=series.user_id,
        title=series.title,
        slug=series.slug,
        palette=series.palette,
        geometry=series.geometry,
        created_at=series.created_at.isoformat(),
    )


@router.get("/series", response_model=List[SeriesResponse])
async def list_series(
    user_id: Optional[int] = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List series (defaults to current user's series)"""
    if not STYLE_SERIES_ENABLED:
        return []
    
    target_user_id = user_id if user_id else user.id
    series_list = db.query(Series).filter(Series.user_id == target_user_id).all()
    
    return [
        SeriesResponse(
            id=s.id,
            user_id=s.user_id,
            title=s.title,
            slug=s.slug,
            palette=s.palette,
            geometry=s.geometry,
            created_at=s.created_at.isoformat(),
        )
        for s in series_list
    ]


@router.get("/series/{series_id}", response_model=SeriesResponse)
async def get_series(
    series_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a specific series"""
    if not STYLE_SERIES_ENABLED:
        raise HTTPException(status_code=404, detail="Series not found")
    
    series = db.query(Series).filter(
        Series.id == series_id,
        Series.user_id == user.id
    ).first()
    
    if not series:
        raise HTTPException(status_code=404, detail="Series not found")
    
    return SeriesResponse(
        id=series.id,
        user_id=series.user_id,
        title=series.title,
        slug=series.slug,
        palette=series.palette,
        geometry=series.geometry,
        created_at=series.created_at.isoformat(),
    )


@router.patch("/series/{series_id}", response_model=SeriesResponse)
async def update_series(
    series_id: int,
    series_data: SeriesUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a series (limited fields)"""
    if not STYLE_SERIES_ENABLED:
        raise HTTPException(status_code=404, detail="Series not found")
    
    series = db.query(Series).filter(
        Series.id == series_id,
        Series.user_id == user.id
    ).first()
    
    if not series:
        raise HTTPException(status_code=404, detail="Series not found")
    
    if series_data.title is not None:
        series.title = series_data.title
    if series_data.palette is not None:
        series.palette = series_data.palette
    if series_data.geometry is not None:
        series.geometry = series_data.geometry
    
    db.commit()
    db.refresh(series)
    
    return SeriesResponse(
        id=series.id,
        user_id=series.user_id,
        title=series.title,
        slug=series.slug,
        palette=series.palette,
        geometry=series.geometry,
        created_at=series.created_at.isoformat(),
    )


@router.get("/health", response_model=dict)
async def health_check(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Health check for style system"""
    seed_exists = user.user_style_seed is not None
    series_count = db.query(Series).filter(Series.user_id == user.id).count()
    unlocks_count = len(user.style_unlocks or [])
    
    return {
        "seed": seed_exists,
        "series_count": series_count,
        "unlocks_count": unlocks_count,
        "features": {
            "style_seed_enabled": STYLE_SEED_ENABLED,
            "style_unlocks_enabled": STYLE_UNLOCKS_ENABLED,
            "style_series_enabled": STYLE_SERIES_ENABLED,
        },
    }

