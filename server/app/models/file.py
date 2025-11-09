"""
File model for uploaded reference audio and generated files
"""
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Enum, Float, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base


class FileKind(str, enum.Enum):
    REFERENCE = "reference"
    GENERATED = "generated"
    STEM = "stem"


class File(Base):
    __tablename__ = "files"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    kind = Column(Enum(FileKind), nullable=False)
    url = Column(String, nullable=False)
    sha256 = Column(String, nullable=True)  # For deduplication
    duration_s = Column(Float, nullable=True)
    bpm = Column(Integer, nullable=True)
    key = Column(String, nullable=True)
    energy = Column(Float, nullable=True)  # 0.0 to 1.0
    loudness = Column(Float, nullable=True)  # LUFS
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="files")

