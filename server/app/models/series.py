"""
Series model for grouping tracks with shared visual style
"""
from sqlalchemy import Column, BigInteger, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Series(Base):
    __tablename__ = "series"

    id = Column(BigInteger, primary_key=True, index=True)
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(Text, nullable=False)
    slug = Column(Text, unique=True, nullable=False, index=True)
    palette = Column(JSON, nullable=False)  # Base hues/lums for visual style
    geometry = Column(JSON, nullable=False)  # Motif knobs (stroke width, rotation, etc.)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="series")
    tracks = relationship("Track", back_populates="series")

