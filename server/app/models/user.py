"""
User model
"""
from sqlalchemy import Column, Integer, String, Enum, DateTime, Boolean, Text, BigInteger, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base


class PlanType(str, enum.Enum):
    FREE = "free"
    PRO = "pro"
    ENTERPRISE = "enterprise"


class PPPBand(str, enum.Enum):
    HIGH = "HIGH"
    UMID = "UMID"
    LMID = "LMID"
    LOW = "LOW"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=True)  # Nullable for OAuth users
    plan = Column(Enum(PlanType), default=PlanType.FREE, nullable=False)
    credits = Column(Integer, default=400, nullable=False)  # Generous trial
    ppp_band = Column(Text, default="HIGH", nullable=False)  # HIGH|UMID|LMID|LOW
    solidarity_opt_in = Column(Boolean, default=False, nullable=False)
    trial_expires_at = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Style system
    user_style_seed = Column(BigInteger, nullable=True)
    style_unlocks = Column(JSON, nullable=False, server_default="[]")

    # Relationships
    tracks = relationship("Track", back_populates="user")
    files = relationship("File", back_populates="user")
    credit_ledger_entries = relationship("CreditLedger", back_populates="user")
    series = relationship("Series", back_populates="user", cascade="all, delete-orphan")

