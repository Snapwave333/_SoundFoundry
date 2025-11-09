"""
Unit tests for credit service
"""
import pytest
from datetime import datetime, timedelta
from app.services.credit_service import CreditService
from app.models.user import User, PlanType


class TestCreditService:
    """Test credit service"""

    @pytest.fixture
    def service(self):
        return CreditService()

    def test_free_tier_duration_limit(self, service, db_session):
        """Test free tier duration limit"""
        user = User(email="test@example.com", plan=PlanType.FREE, credits=10)
        db_session.add(user)
        db_session.commit()

        # Should allow 60s
        allowed, _ = service.check_quota(db_session, user.id, 60)
        assert allowed

        # Should reject > 60s
        allowed, error = service.check_quota(db_session, user.id, 120)
        assert not allowed
        assert "60s" in error

    def test_insufficient_credits(self, service, db_session):
        """Test insufficient credits check"""
        user = User(email="test@example.com", plan=PlanType.FREE, credits=0)
        db_session.add(user)
        db_session.commit()

        allowed, error = service.check_quota(db_session, user.id, 30)
        assert not allowed
        assert "credits" in error.lower()

