"""
Rate limiting middleware
"""
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
import time
from collections import defaultdict
from typing import Dict, Tuple

# Simple in-memory rate limiter (use Redis in production)
rate_limit_store: Dict[str, Tuple[int, float]] = defaultdict(lambda: (0, time.time()))


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Simple rate limiting middleware"""

    def __init__(self, app, requests_per_minute: int = 60):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute

    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for health checks
        if request.url.path == "/api/health":
            return await call_next(request)

        # Get client identifier (IP address)
        client_ip = request.client.host if request.client else "unknown"

        # Check rate limit
        count, reset_time = rate_limit_store[client_ip]
        current_time = time.time()

        # Reset counter if minute has passed
        if current_time > reset_time:
            count = 0
            reset_time = current_time + 60

        # Check if limit exceeded
        if count >= self.requests_per_minute:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded. Please try again later.",
            )

        # Increment counter
        rate_limit_store[client_ip] = (count + 1, reset_time)

        response = await call_next(request)
        return response

