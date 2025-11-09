"""
Free mode service for development/demo mode
"""
import os
import redis
from typing import Optional, Tuple, Dict
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.track import Track


class FreeModeService:
    """Service for managing free mode limits and behavior"""

    def __init__(self):
        """Initialize free mode service"""
        self.enabled = os.getenv("FREE_MODE", "false").lower() == "true"
        self.max_duration_s = int(os.getenv("FREE_MAX_DURATION_S", "60"))
        self.daily_renders = int(os.getenv("FREE_DAILY_RENDERS", "10"))
        self.watermark = os.getenv("FREE_WATERMARK", "true").lower() == "true"
        self.block_publish = os.getenv("FREE_BLOCK_PUBLISH", "true").lower() == "true"
        
        # Redis connection for daily limit tracking
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
        try:
            self.redis_client = redis.from_url(redis_url, decode_responses=True)
            # Test connection
            self.redis_client.ping()
        except Exception:
            # If Redis is not available, fall back to in-memory tracking
            # This is not ideal for production but allows development without Redis
            self.redis_client = None
            self._in_memory_counts: Dict[int, Tuple[int, datetime]] = {}

    def is_enabled(self) -> bool:
        """Check if free mode is enabled"""
        return self.enabled

    def check_duration_limit(self, duration_s: int) -> Tuple[bool, Optional[str]]:
        """
        Check if duration exceeds free mode limit
        Returns (allowed, error_message)
        """
        if not self.enabled:
            return True, None
        
        if duration_s > self.max_duration_s:
            return (
                False,
                f"Free mode limited to {self.max_duration_s}s. Set FREE_MODE=false for production.",
            )
        return True, None

    def check_daily_limit(self, db: Session, user_id: int) -> Tuple[bool, Optional[str]]:
        """
        Check if user has exceeded daily render limit
        Returns (allowed, error_message)
        """
        if not self.enabled:
            return True, None
        
        today = datetime.now().date()
        count = self._get_daily_count(user_id, today)
        
        if count >= self.daily_renders:
            return (
                False,
                f"Free mode limited to {self.daily_renders} renders per day. Set FREE_MODE=false for production.",
            )
        return True, None

    def increment_daily_count(self, user_id: int):
        """Increment daily render count for user"""
        if not self.enabled:
            return
        
        today = datetime.now().date()
        self._increment_count(user_id, today)

    def _get_daily_count(self, user_id: int, date: datetime.date) -> int:
        """Get daily render count for user"""
        if self.redis_client:
            key = f"free_mode:renders:{user_id}:{date.isoformat()}"
            count = self.redis_client.get(key)
            return int(count) if count else 0
        else:
            # In-memory fallback
            if user_id not in self._in_memory_counts:
                return 0
            count, stored_date = self._in_memory_counts[user_id]
            if stored_date.date() == date:
                return count
            return 0

    def _increment_count(self, user_id: int, date: datetime.date):
        """Increment render count for user on given date"""
        if self.redis_client:
            key = f"free_mode:renders:{user_id}:{date.isoformat()}"
            # Increment and set expiry to end of day + 1 day buffer
            self.redis_client.incr(key)
            # Expire at end of tomorrow
            tomorrow = date + timedelta(days=2)
            expiry = datetime.combine(tomorrow, datetime.max.time())
            ttl = int((expiry - datetime.now()).total_seconds())
            self.redis_client.expire(key, ttl)
        else:
            # In-memory fallback
            if user_id not in self._in_memory_counts:
                self._in_memory_counts[user_id] = (0, datetime.now())
            count, stored_date = self._in_memory_counts[user_id]
            if stored_date.date() == date:
                self._in_memory_counts[user_id] = (count + 1, stored_date)
            else:
                self._in_memory_counts[user_id] = (1, datetime.now())

    def should_apply_watermark(self) -> bool:
        """Check if watermark should be applied to audio"""
        return self.enabled and self.watermark

    def can_publish(self) -> Tuple[bool, Optional[str]]:
        """
        Check if publishing is allowed in free mode
        Returns (allowed, error_message)
        """
        if not self.enabled:
            return True, None
        
        if self.block_publish:
            return (
                False,
                "Publishing disabled in free mode. Set FREE_MODE=false for production.",
            )
        return True, None

    def get_mode_info(self) -> dict:
        """Get free mode configuration info for UI"""
        return {
            "enabled": self.enabled,
            "max_duration_s": self.max_duration_s,
            "daily_renders": self.daily_renders,
            "watermark": self.watermark,
            "block_publish": self.block_publish,
        }


# Singleton instance
_free_mode_service: Optional[FreeModeService] = None


def get_free_mode_service() -> FreeModeService:
    """Get or create free mode service instance"""
    global _free_mode_service
    if _free_mode_service is None:
        _free_mode_service = FreeModeService()
    return _free_mode_service

