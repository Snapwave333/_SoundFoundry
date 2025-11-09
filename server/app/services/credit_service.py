"""
Credit service for managing user credits and quotas
"""
from sqlalchemy.orm import Session
from app.models.user import User, PlanType
from app.models.credit_ledger import CreditLedger
from app.models.track import Track
from app.models.job import Job, JobStatus
from app.services.free_mode_service import get_free_mode_service
from math import ceil
from datetime import datetime
from typing import Optional, Tuple


class CreditService:
    """Service for managing credits and enforcing quotas"""

    # 1 credit = 30 seconds of audio
    SECONDS_PER_CREDIT = 30

    def calculate_credits_required(self, duration_s: int) -> int:
        """
        Calculate credits required for a render
        Formula: ceil(duration_seconds / 30)
        """
        return ceil(duration_s / self.SECONDS_PER_CREDIT)

    def check_quota(
        self, db: Session, user_id: int, duration_s: int
    ) -> tuple[bool, Optional[str]]:
        """
        Check if user can generate a track with given duration
        Returns (allowed, error_message)
        """
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return False, "User not found"

        free_mode = get_free_mode_service()
        
        # Check free mode duration limit
        if free_mode.is_enabled():
            allowed, error_msg = free_mode.check_duration_limit(duration_s)
            if not allowed:
                return False, error_msg
            
            # Check free mode daily limit
            allowed, error_msg = free_mode.check_daily_limit(db, user_id)
            if not allowed:
                return False, error_msg
        
        # In free mode, skip credit check
        if free_mode.is_enabled():
            return True, None

        # Calculate credits required
        credits_required = self.calculate_credits_required(duration_s)
        
        # Check if user has enough credits
        if user.credits < credits_required:
            return (
                False,
                f"Insufficient credits. This render requires {credits_required} credits, but you have {user.credits}.",
            )

        return True, None

    def debit_credits(
        self,
        db: Session,
        user_id: int,
        duration_s: int,
        track_id: Optional[int] = None,
        job_id: Optional[int] = None,
    ) -> bool:
        """
        Debit credits from user account for a track generation
        Returns True if successful, False otherwise
        """
        free_mode = get_free_mode_service()
        
        # In free mode, don't debit credits
        if free_mode.is_enabled():
            free_mode.increment_daily_count(user_id)
            return True
        
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return False

        credits_required = self.calculate_credits_required(duration_s)
        
        if user.credits < credits_required:
            return False

        user.credits -= credits_required

        # Create ledger entry
        ledger_entry = CreditLedger(
            user_id=user_id,
            track_id=track_id,
            delta=-credits_required,
            reason="track_generate",
            job_id=job_id,
            meta={
                "duration_s": duration_s,
                "credits_required": credits_required,
            },
        )
        db.add(ledger_entry)
        db.commit()

        return True

    def refund_failed_render(
        self,
        db: Session,
        user_id: int,
        track_id: int,
        reason: str = "refund_failure",
    ) -> bool:
        """
        Refund credits for a failed or timed-out render
        Finds the original debit entry and refunds the full amount
        """
        # Find the original debit entry for this track
        original_entry = (
            db.query(CreditLedger)
            .filter(
                CreditLedger.user_id == user_id,
                CreditLedger.track_id == track_id,
                CreditLedger.delta < 0,  # Negative = debit
                CreditLedger.reason == "track_generate",
            )
            .first()
        )

        if not original_entry:
            # No debit found, nothing to refund
            return False

        refund_amount = abs(original_entry.delta)
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return False

        user.credits += refund_amount

        # Create refund ledger entry
        refund_entry = CreditLedger(
            user_id=user_id,
            track_id=track_id,
            delta=refund_amount,
            reason=reason,
            meta={
                "refunded_entry_id": original_entry.id,
                "original_delta": original_entry.delta,
                "refund_reason": reason,
            },
        )
        db.add(refund_entry)
        db.commit()

        return True

    def refund_quality_partial(
        self,
        db: Session,
        user_id: int,
        track_id: int,
    ) -> bool:
        """
        Refund 50% of credits for quality issues
        One-click refund button on track page
        """
        # Find the original debit entry for this track
        original_entry = (
            db.query(CreditLedger)
            .filter(
                CreditLedger.user_id == user_id,
                CreditLedger.track_id == track_id,
                CreditLedger.delta < 0,  # Negative = debit
                CreditLedger.reason == "track_generate",
            )
            .first()
        )

        if not original_entry:
            return False

        # Check if already refunded
        existing_refund = (
            db.query(CreditLedger)
            .filter(
                CreditLedger.user_id == user_id,
                CreditLedger.track_id == track_id,
                CreditLedger.reason == "quality_partial",
            )
            .first()
        )
        
        if existing_refund:
            # Already refunded
            return False

        original_amount = abs(original_entry.delta)
        refund_amount = ceil(original_amount * 0.5)  # 50% refund
        
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return False

        user.credits += refund_amount

        # Create partial refund ledger entry
        refund_entry = CreditLedger(
            user_id=user_id,
            track_id=track_id,
            delta=refund_amount,
            reason="quality_partial",
            meta={
                "refunded_entry_id": original_entry.id,
                "original_amount": original_amount,
                "refund_amount": refund_amount,
                "refund_percentage": 50,
            },
        )
        db.add(refund_entry)
        db.commit()

        return True

    def credit_credits(
        self,
        db: Session,
        user_id: int,
        amount: int,
        reason: str,
        meta: Optional[dict] = None,
    ) -> bool:
        """Add credits to user account"""
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return False

        user.credits += amount

        # Create ledger entry
        ledger_entry = CreditLedger(
            user_id=user_id,
            delta=amount,
            reason=reason,
            meta=meta,
        )
        db.add(ledger_entry)
        db.commit()

        return True

    def get_user_credits(self, db: Session, user_id: int) -> int:
        """Get current credit balance"""
        user = db.query(User).filter(User.id == user_id).first()
        return user.credits if user else 0

    def get_credits_required_for_duration(self, duration_s: int) -> int:
        """Get credits required for a given duration (for UI preview)"""
        return self.calculate_credits_required(duration_s)


# Singleton instance
_credit_service: Optional[CreditService] = None


def get_credit_service() -> CreditService:
    """Get or create credit service instance"""
    global _credit_service
    if _credit_service is None:
        _credit_service = CreditService()
    return _credit_service
