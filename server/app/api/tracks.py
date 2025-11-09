"""
Track API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import httpx
from app.database import get_db
from app.models.track import Track, TrackStatus
from app.models.user import User
from app.models.series import Series
from app.models.job import Job, JobStatus
from app.services.storage import get_storage_service
from app.services.credit_service import get_credit_service
from app.services.content_policy import get_content_policy
from app.services.free_mode_service import get_free_mode_service
from app.utils.style_seed import get_or_create_style_seed, update_user_unlocks
from app.api.style import get_default_series_palette, get_default_series_geometry, slugify

router = APIRouter()


class TrackCreate(BaseModel):
    prompt: str
    lyrics: Optional[str] = None
    has_vocals: bool = False
    duration_s: int = 60
    style_strength: float = 0.5
    seed: Optional[int] = None
    genre: Optional[str] = None
    tempo: Optional[int] = None
    key: Optional[str] = None
    reference_file_id: Optional[int] = None
    series_id: Optional[int] = None  # Style system: optional series


class TrackResponse(BaseModel):
    id: int
    title: Optional[str]
    prompt: str
    status: str
    preview_url: Optional[str]
    file_url: Optional[str]
    created_at: str
    credits_required: Optional[int] = None

    class Config:
        from_attributes = True


class CostPreviewResponse(BaseModel):
    duration_s: int
    credits_required: int
    free_mode_enabled: bool
    free_mode_info: Optional[dict] = None


@router.get("/cost-preview", response_model=CostPreviewResponse)
async def get_cost_preview(
    duration_s: int,
    db: Session = Depends(get_db),
    # TODO: Add authentication dependency
):
    """Get cost preview for a track generation"""
    # TODO: Get current user from auth
    user = db.query(User).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    credit_service = get_credit_service()
    free_mode = get_free_mode_service()
    
    credits_required = credit_service.get_credits_required_for_duration(duration_s)
    
    response = {
        "duration_s": duration_s,
        "credits_required": credits_required,
        "free_mode_enabled": free_mode.is_enabled(),
    }
    
    if free_mode.is_enabled():
        response["free_mode_info"] = free_mode.get_mode_info()
    
    return response


@router.post("", response_model=dict)
async def create_track(
    track_data: TrackCreate,
    db: Session = Depends(get_db),
    # TODO: Add authentication dependency
):
    """Create a new track generation job"""
    # TODO: Get current user from auth
    # For now, create a placeholder user
    user = db.query(User).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No user found. Please set up authentication first.",
        )

    # Check content policy
    content_policy = get_content_policy()
    allowed, reason = content_policy.check_prompt(track_data.prompt)
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=reason,
        )

    if track_data.lyrics:
        allowed, reason = content_policy.check_lyrics(track_data.lyrics)
        if not allowed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=reason,
            )

    # Check quota and credits (includes free mode checks)
    credit_service = get_credit_service()
    allowed, error_msg = credit_service.check_quota(db, user.id, track_data.duration_s)
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=error_msg,
        )

    # Handle series (get or create default)
    series_id = track_data.series_id
    if series_id is None:
        # Get or create default series for user
        default_series = db.query(Series).filter(
            Series.user_id == user.id,
            Series.slug == "default"
        ).first()
        
        if not default_series:
            # Ensure style seed exists
            style_seed = get_or_create_style_seed(user)
            if user.user_style_seed is None:
                user.user_style_seed = style_seed
                db.commit()
            
            default_series = Series(
                user_id=user.id,
                title="Default Series",
                slug="default",
                palette=get_default_series_palette(style_seed),
                geometry=get_default_series_geometry(style_seed),
            )
            db.add(default_series)
            db.commit()
            db.refresh(default_series)
        
        series_id = default_series.id
    else:
        # Validate series belongs to user
        series = db.query(Series).filter(
            Series.id == series_id,
            Series.user_id == user.id
        ).first()
        if not series:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Series not found",
            )

    # Create track record
    track = Track(
        user_id=user.id,
        prompt=track_data.prompt,
        lyrics=track_data.lyrics,
        has_vocals=track_data.has_vocals,
        duration_s=track_data.duration_s,
        style_strength=track_data.style_strength,
        seed=track_data.seed,
        key=track_data.key,
        bpm=track_data.tempo,
        reference_file_id=track_data.reference_file_id,
        series_id=series_id,
        visual_version=1,  # Start at version 1
        provider="fal",  # Default to FAL (with Replicate fallback)
        status=TrackStatus.QUEUED,
    )
    db.add(track)
    db.commit()
    db.refresh(track)

    # Debit credits (handles free mode internally)
    success = credit_service.debit_credits(
        db, user.id, track_data.duration_s, track_id=track.id
    )
    if not success:
        # Rollback track creation if credit debit fails
        db.delete(track)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Failed to debit credits. Please try again.",
        )

    # Queue Celery job for music generation
    from app.workers.generate_music import generate_music_task
    celery_job = generate_music_task.delay(track.id)

    # Create job record
    job = Job(
        track_id=track.id,
        provider_job_id=str(celery_job.id),
        status=JobStatus.QUEUED,
        progress=0.0,
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    credits_required = credit_service.get_credits_required_for_duration(track_data.duration_s)
    
    # Update unlocks after track creation (async, don't block)
    try:
        update_user_unlocks(user.id, db)
    except Exception:
        # Don't fail track creation if unlock update fails
        pass
    
    # Emit telemetry event
    from app.middleware.observability import emit_event
    emit_event("track.created", {
        "track_id": track.id,
        "user_id": user.id,
        "duration": track_data.duration_s,
        "vocals": track_data.has_vocals,
        "provider": track.provider,
        "series_id": track.series_id,
    })
    
    return {
        "track_id": track.id,
        "job_id": job.id,
        "credits_required": credits_required,
    }


@router.get("/{track_id}", response_model=TrackResponse)
async def get_track(track_id: int, db: Session = Depends(get_db)):
    """Get track details"""
    track = db.query(Track).filter(Track.id == track_id).first()
    if not track:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Track not found"
        )
    
    credit_service = get_credit_service()
    credits_required = credit_service.get_credits_required_for_duration(track.duration_s)
    
    # Get series info if exists
    series_info = None
    if track.series_id:
        series = db.query(Series).filter(Series.id == track.series_id).first()
        if series:
            series_info = {
                "id": series.id,
                "title": series.title,
                "slug": series.slug,
            }
    
    return {
        "id": track.id,
        "title": track.title,
        "prompt": track.prompt,
        "status": track.status.value,
        "preview_url": track.preview_url,
        "file_url": track.file_url,
        "created_at": track.created_at.isoformat() if track.created_at else "",
        "credits_required": credits_required,
        "series_id": track.series_id,
        "visual_version": track.visual_version,
        "cover_url": track.cover_url,
        "series": series_info,
    }


@router.post("/{track_id}/increment-visual-version", response_model=dict)
async def increment_visual_version(
    track_id: int,
    db: Session = Depends(get_db),
    # TODO: Add authentication dependency
):
    """Increment visual version for cover regeneration"""
    track = db.query(Track).filter(Track.id == track_id).first()
    if not track:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Track not found"
        )
    
    # TODO: Verify user owns track
    
    track.visual_version += 1
    db.commit()
    db.refresh(track)
    
    return {
        "track_id": track.id,
        "visual_version": track.visual_version,
    }


class CoverSaveRequest(BaseModel):
    svg: str
    dark: Optional[bool] = False


# Rate limiting for cover saves (30/min per user)
from collections import defaultdict
from time import time

_cover_save_rates: dict[int, list[float]] = defaultdict(list)
RATE_LIMIT_COVER_SAVES = 30  # per minute
RATE_LIMIT_WINDOW = 60  # seconds

def check_cover_rate_limit(user_id: int) -> bool:
    """Check if user has exceeded cover save rate limit"""
    now = time()
    # Clean old entries
    _cover_save_rates[user_id] = [
        t for t in _cover_save_rates[user_id] if now - t < RATE_LIMIT_WINDOW
    ]
    # Check limit
    if len(_cover_save_rates[user_id]) >= RATE_LIMIT_COVER_SAVES:
        return False
    # Record this request
    _cover_save_rates[user_id].append(now)
    return True


@router.post("/{track_id}/cover", response_model=dict)
async def save_cover(
    track_id: int,
    cover_data: CoverSaveRequest,
    db: Session = Depends(get_db),
    # TODO: Add authentication dependency
):
    """Save cover SVG to S3 and update track.cover_url"""
    track = db.query(Track).filter(Track.id == track_id).first()
    if not track:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Track not found"
        )
    
    # TODO: Verify user owns track
    user_id = track.user_id  # For rate limiting
    
    # Rate limit check
    if not check_cover_rate_limit(user_id):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Maximum 30 cover saves per minute.",
        )
    
    # Validate SVG size (≤1MB)
    svg_bytes = cover_data.svg.encode("utf-8")
    if len(svg_bytes) > 1024 * 1024:  # 1MB
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="SVG too large (max 1MB)",
        )
    
    # Basic SVG sanitization check
    if not cover_data.svg.strip().startswith("<?xml") and not cover_data.svg.strip().startswith("<svg"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid SVG format",
        )
    
    # Upload to S3 (idempotent: same key = same file)
    storage_service = get_storage_service()
    key = f"covers/{track_id}.svg"
    
    try:
        url = storage_service.upload_file_content(
            key=key,
            content=svg_bytes,
            content_type="image/svg+xml",
            public=False,
        )
        
        track.cover_url = url
        db.commit()
        
        # Emit telemetry event
        from app.middleware.observability import emit_event
        emit_event("cover.saved", {
            "track_id": track.id,
            "user_id": user_id,
            "size_bytes": len(svg_bytes),
            "format": "svg",
        })
        
        return {
            "track_id": track.id,
            "cover_url": url,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save cover: {str(e)}",
        )


@router.post("/{track_id}/refund-quality")
async def refund_quality_issue(
    track_id: int,
    db: Session = Depends(get_db),
    # TODO: Add authentication dependency
):
    """One-click partial refund (50%) for quality issues"""
    # TODO: Get current user from auth and verify ownership
    user = db.query(User).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    track = db.query(Track).filter(Track.id == track_id).first()
    if not track:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Track not found",
        )
    
    # Verify ownership (TODO: use auth)
    if track.user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to refund this track",
        )
    
    # Only allow refund for completed tracks
    if track.status != TrackStatus.COMPLETE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only refund completed tracks",
        )
    
    credit_service = get_credit_service()
    success = credit_service.refund_quality_partial(db, user.id, track_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Refund failed. Track may have already been refunded or no debit found.",
        )
    
    return {
        "success": True,
        "message": "50% credits refunded for quality issues",
        "track_id": track_id,
    }


@router.get("/{track_id}/stream")
async def stream_track(track_id: int, db: Session = Depends(get_db)):
    """Stream track audio file"""
    track = db.query(Track).filter(Track.id == track_id).first()
    if not track:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Track not found"
        )

    if not track.preview_url and not track.file_url:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Track file not available",
        )

    url = track.preview_url or track.file_url

    async def generate():
        async with httpx.AsyncClient() as client:
            async with client.stream("GET", url) as response:
                response.raise_for_status()
                async for chunk in response.aiter_bytes():
                    yield chunk

    return StreamingResponse(
        generate(),
        media_type="audio/mpeg",
        headers={
            "Content-Disposition": f'inline; filename="track_{track_id}.mp3"',
            "Cache-Control": "public, max-age=3600",
        },
    )


@router.post("/{track_id}/publish")
async def publish_track(
    track_id: int, public: bool, db: Session = Depends(get_db)
):
    """Toggle track public visibility"""
    track = db.query(Track).filter(Track.id == track_id).first()
    if not track:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Track not found"
        )
    
    # Check free mode publishing restrictions
    free_mode = get_free_mode_service()
    allowed, error_msg = free_mode.can_publish()
    if not allowed and public:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=error_msg,
        )
    
    track.public = public
    db.commit()
    return {"public": public}
