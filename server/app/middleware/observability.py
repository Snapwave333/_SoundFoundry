"""
Observability middleware for OpenTelemetry, Sentry, and Prometheus
"""
import os
import logging
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
import time
from prometheus_client import Counter, Histogram, generate_latest
from prometheus_client.openmetrics.exposition import CONTENT_TYPE_LATEST

# Prometheus metrics
http_requests_total = Counter(
    "http_requests_total", "Total HTTP requests", ["method", "endpoint", "status"]
)
http_request_duration_seconds = Histogram(
    "http_request_duration_seconds",
    "HTTP request duration in seconds",
    ["method", "endpoint"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Initialize Sentry if DSN is provided
sentry_dsn = os.getenv("SENTRY_DSN")
if sentry_dsn:
    import sentry_sdk
    from sentry_sdk.integrations.fastapi import FastApiIntegration
    from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration

    sentry_sdk.init(
        dsn=sentry_dsn,
        integrations=[
            FastApiIntegration(),
            SqlalchemyIntegration(),
        ],
        traces_sample_rate=0.1,
        environment=os.getenv("ENVIRONMENT", "development"),
    )


class ObservabilityMiddleware(BaseHTTPMiddleware):
    """Middleware for observability"""

    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        # Log request
        logger.info(f"{request.method} {request.url.path}")

        try:
            response = await call_next(request)
            
            # Record metrics
            duration = time.time() - start_time
            http_requests_total.labels(
                method=request.method,
                endpoint=request.url.path,
                status=response.status_code,
            ).inc()
            http_request_duration_seconds.labels(
                method=request.method,
                endpoint=request.url.path,
            ).observe(duration)

            return response
        except Exception as e:
            # Record error metrics
            http_requests_total.labels(
                method=request.method,
                endpoint=request.url.path,
                status=500,
            ).inc()
            
            logger.error(f"Request failed: {e}", exc_info=True)
            raise


# Metrics endpoint is added in main.py

def emit_event(event_name: str, data: dict):
    """
    Emit telemetry event
    In production, this would send to analytics service (PostHog, Mixpanel, etc.)
    """
    logger.info(f"Event: {event_name}", extra={"event_data": data})
    
    # If Sentry is configured, add breadcrumb
    if sentry_dsn:
        import sentry_sdk
        sentry_sdk.add_breadcrumb(
            message=event_name,
            data=data,
            level="info",
        )

