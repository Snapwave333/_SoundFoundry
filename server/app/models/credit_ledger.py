"""
Credit ledger for tracking credit transactions
"""
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class CreditLedger(Base):
    __tablename__ = "credit_ledger"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    track_id = Column(Integer, ForeignKey("tracks.id", ondelete="SET NULL"), nullable=True)
    delta = Column(Integer, nullable=False)  # Positive for credits added, negative for used
    reason = Column(Text, nullable=False)  # 'track_generate','purchase','refund_failure','quality_partial','admin_grant'
    meta = Column(JSONB, nullable=True)  # Store pricing snapshots, refund details, etc.
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="credit_ledger_entries")
    track = relationship("Track", foreign_keys=[track_id])

