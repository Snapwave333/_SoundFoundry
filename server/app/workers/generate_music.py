"""
Celery task for generating music
"""
from app.celery_app import celery_app
from app.database import SessionLocal
from app.models.track import Track, TrackStatus
from app.models.job import Job, JobStatus
from app.services.model_provider import ModelProvider, get_provider
from app.services.storage import get_storage_service
from app.services.credit_service import get_credit_service
from app.services.free_mode_service import get_free_mode_service
import os
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

# Log provider info on module load
try:
    import fal_client
    fal_version = getattr(fal_client, "__version__", "unknown")
    logger.info(f"fal-client loaded: version={fal_version}")
except ImportError:
    logger.warning("fal-client not available")

music_provider = os.getenv("MUSIC_PROVIDER", "fal")
logger.info(f"Default MUSIC_PROVIDER: {music_provider}")


@celery_app.task(bind=True, name="generate_music")
def generate_music_task(self, track_id: int):
    """
    Generate music for a track
    """
    db = SessionLocal()
    try:
        track = db.query(Track).filter(Track.id == track_id).first()
        if not track:
            return {"error": "Track not found"}

        # Create job record
        job = Job(
            track_id=track.id,
            status=JobStatus.PROCESSING,
            progress=0.0,
        )
        db.add(job)
        db.commit()

        # Update track status
        track.status = TrackStatus.RENDERING
        db.commit()

        # Get model provider (with auto-fallback)
        provider_attempt = 1
        provider_name = track.provider
        provider_error = None
        
        try:
            provider: ModelProvider = get_provider(track.provider)
            logger.info(
                f"Job {job.id}: Using provider: {track.provider}, "
                f"track_id={track.id}, attempt={provider_attempt}"
            )
        except Exception as e:
            provider_error = str(e)
            error_code = "403" if "403" in provider_error or "Forbidden" in provider_error else "unknown"
            logger.error(
                f"Job {job.id}: Provider {track.provider} failed: {provider_error}, "
                f"track_id={track.id}, attempt={provider_attempt}, error_code={error_code}"
            )
            
            # Try fallback
            fallback_provider = "replicate" if track.provider == "fal" else "fal"
            provider_attempt = 2
            logger.warning(
                f"Job {job.id}: Falling back to {fallback_provider}, "
                f"track_id={track.id}, attempt={provider_attempt}"
            )
            try:
                provider = get_provider(fallback_provider)
                track.provider = fallback_provider  # Update track to reflect fallback
                provider_name = fallback_provider
                db.commit()
                logger.info(
                    f"Job {job.id}: Fallback successful, using {fallback_provider}, "
                    f"track_id={track.id}"
                )
            except Exception as fallback_error:
                fallback_error_code = "403" if "403" in str(fallback_error) or "Forbidden" in str(fallback_error) else "unknown"
                logger.error(
                    f"Job {job.id}: Fallback provider ({fallback_provider}) also failed: {fallback_error}, "
                    f"track_id={track.id}, error_code={fallback_error_code}"
                )
                raise Exception(
                    f"Primary provider ({track.provider}) failed: {str(e)}. "
                    f"Fallback provider ({fallback_provider}) also failed: {str(fallback_error)}"
                )

        # Get reference URL if available
        reference_url = None
        if track.reference_file_id:
            from app.models.file import File
            ref_file = db.query(File).filter(File.id == track.reference_file_id).first()
            if ref_file:
                reference_url = ref_file.url

        # Update progress
        job.progress = 0.1
        db.commit()

        # Generate music
        result = provider.generate(
            prompt=track.prompt,
            duration_s=track.duration_s,
            lyrics=track.lyrics if track.has_vocals else None,
            style_strength=track.style_strength,
            seed=track.seed,
            reference_url=reference_url,
        )

        job.progress = 0.8
        db.commit()

        # Download and store the generated file
        storage = get_storage_service()
        object_key = f"tracks/{track.user_id}/{track.id}/{datetime.now().isoformat()}.mp3"
        
        # Upload from provider URL to our storage
        file_url = storage.upload_from_url(result["file_url"], object_key)

        # Update job and track
        job.progress = 1.0
        job.status = JobStatus.COMPLETE
        track.status = TrackStatus.COMPLETE
        track.file_url = file_url
        track.preview_url = file_url  # Use same URL for preview initially
        db.commit()

        return {"status": "complete", "track_id": track_id}
    except Exception as e:
        # Update job with error
        if "job" in locals() and "track" in locals():
            job.status = JobStatus.FAILED
            job.error = str(e)
            track.status = TrackStatus.FAILED
            track.error_message = str(e)
            db.commit()
            
            # Refund credits for failed render (only if not in free mode)
            free_mode = get_free_mode_service()
            if not free_mode.is_enabled():
                credit_service = get_credit_service()
                # Determine refund reason based on error
                error_str = str(e).lower()
                if "timeout" in error_str or "timed out" in error_str:
                    reason = "refund_failure"
                else:
                    reason = "refund_failure"
                
                credit_service.refund_failed_render(
                    db, track.user_id, track.id, reason=reason
                )
        return {"error": str(e)}
    finally:
        db.close()

