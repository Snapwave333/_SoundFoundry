"""
Job API endpoints for tracking generation progress
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.models.job import Job, JobStatus

router = APIRouter()


class JobResponse(BaseModel):
    id: int
    track_id: int
    status: str
    progress: float
    error: Optional[str] = None

    class Config:
        from_attributes = True


@router.get("/{job_id}", response_model=JobResponse)
async def get_job(job_id: int, db: Session = Depends(get_db)):
    """Get job status and progress"""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(
            status_code=404, detail="Job not found"
        )
    return job


@router.get("/{job_id}/logs")
async def get_job_logs(job_id: int, limit: int = 50, db: Session = Depends(get_db)):
    """
    Get recent logs for a job (last N provider messages)
    Returns structured log entries with provider, attempt, error_code, etc.
    """
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Get track to see provider used
    from app.models.track import Track
    track = db.query(Track).filter(Track.id == job.track_id).first()
    
    logs = []
    
    # Add job status changes as log entries
    if job.error:
        error_code = "403" if "403" in job.error or "Forbidden" in job.error else "unknown"
        logs.append({
            "timestamp": job.updated_at.isoformat() if job.updated_at else None,
            "provider": track.provider if track else "unknown",
            "attempt": 1,
            "error_code": error_code,
            "message": job.error,
            "status": job.status.value,
        })
    
    # Add track status info
    if track:
        logs.append({
            "timestamp": track.updated_at.isoformat() if track.updated_at else track.created_at.isoformat() if track.created_at else None,
            "provider": track.provider,
            "attempt": 1,
            "error_code": None,
            "message": f"Track status: {track.status.value}",
            "status": track.status.value,
        })
    
    # Return last N entries
    return {"job_id": job_id, "logs": logs[-limit:]}

