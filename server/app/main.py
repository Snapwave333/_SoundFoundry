"""
SoundFoundry API - Main FastAPI application
"""
from dotenv import load_dotenv
from pathlib import Path

# Load .env file explicitly before any other imports
# Path resolution: __file__ is app/main.py, parents[1] is server/, so .env is server/.env
env_path = Path(__file__).resolve().parents[1] / ".env"
load_dotenv(dotenv_path=env_path, override=True)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from contextlib import asynccontextmanager
import os

from app.database import engine, Base
from app.api import health, tracks, jobs, analyze, credits, style
from app.api import stripe_webhook
from app.middleware.rate_limit import RateLimitMiddleware
from app.middleware.observability import ObservabilityMiddleware
from fastapi.responses import Response
from prometheus_client import generate_latest
from prometheus_client.openmetrics.exposition import CONTENT_TYPE_LATEST


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan events for startup and shutdown"""
    # Startup: Create database tables
    Base.metadata.create_all(bind=engine)
    yield
    # Shutdown: Cleanup if needed
    pass


app = FastAPI(
    title="SoundFoundry API",
    description="AI Music Generator API",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Trusted host middleware (for production)
if os.getenv("ENVIRONMENT") == "production":
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=os.getenv("ALLOWED_HOSTS", "").split(","),
    )

# Observability middleware (must be before rate limiting)
app.add_middleware(ObservabilityMiddleware)

# Rate limiting middleware
app.add_middleware(RateLimitMiddleware)

# Include routers
app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(tracks.router, prefix="/api/tracks", tags=["tracks"])
app.include_router(jobs.router, prefix="/api/jobs", tags=["jobs"])
app.include_router(analyze.router, prefix="/api/analyze", tags=["analyze"])
app.include_router(credits.router, prefix="/api/credits", tags=["credits"])
app.include_router(stripe_webhook.router, prefix="/api/stripe", tags=["stripe"])
app.include_router(style.router, prefix="/api/style", tags=["style"])

# Provider health endpoint is included via health.router above


@app.get("/")
async def root():
    return {"message": "SoundFoundry API", "version": "1.0.0"}


@app.get("/metrics")
async def metrics():
    """Prometheus metrics endpoint"""
    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)

