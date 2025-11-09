"""
Track model
"""
from sqlalchemy import Column, Integer, String, Boolean, Float, ForeignKey, DateTime, Enum, Text, BigInteger
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base


class TrackStatus(str, enum.Enum):
    QUEUED = "queued"
    RENDERING = "rendering"
    MASTERING = "mastering"
    COMPLETE = "complete"
    FAILED = "failed"


class Track(Base):
    __tablename__ = "tracks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=True)
    prompt = Column(Text, nullable=False)
    lyrics = Column(Text, nullable=True)
    has_vocals = Column(Boolean, default=False, nullable=False)
    duration_s = Column(Integer, nullable=False)  # Requested duration
    bpm = Column(Integer, nullable=True)
    key = Column(String, nullable=True)
    style_strength = Column(Float, default=0.5, nullable=False)
    provider = Column(String, nullable=False)  # "fal" or "replicate"
    seed = Column(Integer, nullable=True)
    status = Column(Enum(TrackStatus), default=TrackStatus.QUEUED, nullable=False)
    public = Column(Boolean, default=False, nullable=False)
    preview_url = Column(String, nullable=True)
    file_url = Column(String, nullable=True)
    stems_zip_url = Column(String, nullable=True)
    reference_file_id = Column(Integer, ForeignKey("files.id"), nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Style system
    series_id = Column(BigInteger, ForeignKey("series.id", ondelete="SET NULL"), nullable=True, index=True)
    visual_version = Column(Integer, nullable=False, server_default="1")
    cover_url = Column(String, nullable=True)

    # Relationships
    user = relationship("User", back_populates="tracks")
    jobs = relationship("Job", back_populates="track")
    reference_file = relationship("File", foreign_keys=[reference_file_id])
    series = relationship("Series", back_populates="tracks")

