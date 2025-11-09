"""
Celery application configuration
"""
from dotenv import load_dotenv
from pathlib import Path

# Load .env file explicitly before any other imports
# Path resolution: __file__ is app/celery_app.py, parents[1] is server/, so .env is server/.env
env_path = Path(__file__).resolve().parents[1] / ".env"
load_dotenv(dotenv_path=env_path, override=True)

from celery import Celery
import os

redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "soundfoundry",
    broker=redis_url,
    backend=redis_url,
    include=["app.workers.generate_music"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=300,  # 5 minutes
    task_soft_time_limit=240,  # 4 minutes
)

