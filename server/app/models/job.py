"""
Job model for tracking async music generation tasks
"""
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Enum, Float, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base


class JobStatus(str, enum.Enum):
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETE = "complete"
    FAILED = "failed"
    CANCELLED = "cancelled"


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    track_id = Column(Integer, ForeignKey("tracks.id"), nullable=False)
    provider_job_id = Column(String, nullable=True)  # External provider's job ID
    status = Column(Enum(JobStatus), default=JobStatus.QUEUED, nullable=False)
    progress = Column(Float, default=0.0, nullable=False)  # 0.0 to 1.0
    error = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    track = relationship("Track", back_populates="jobs")

