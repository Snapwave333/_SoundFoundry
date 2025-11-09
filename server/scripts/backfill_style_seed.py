"""
Backfill script for style seed system
Run after migration 003_style_seed_system
"""
import hashlib
from sqlalchemy import text
from app.database import SessionLocal
from app.models.user import User
from app.models.series import Series
from app.models.track import Track
from app.utils.style_seed import derive_style_seed, get_default_series_palette, get_default_series_geometry


def backfill_style_seeds():
    """Backfill user_style_seed for existing users"""
    db = SessionLocal()
    try:
        users = db.query(User).filter(User.user_style_seed.is_(None)).all()
        for user in users:
            seed = derive_style_seed(user.email, user.created_at)
            user.user_style_seed = seed
        db.commit()
        print(f"Backfilled {len(users)} user style seeds")
    except Exception as e:
        db.rollback()
        print(f"Error backfilling seeds: {e}")
        raise
    finally:
        db.close()


def backfill_default_series():
    """Create default series for users without one"""
    db = SessionLocal()
    try:
        users = db.query(User).all()
        created = 0
        for user in users:
            # Check if user has a default series
            existing = db.query(Series).filter(
                Series.user_id == user.id,
                Series.slug.like(f"default-%")
            ).first()
            
            if not existing:
                seed = user.user_style_seed or derive_style_seed(user.email, user.created_at)
                if user.user_style_seed is None:
                    user.user_style_seed = seed
                
                series = Series(
                    user_id=user.id,
                    title="Default Series",
                    slug=f"default-{user.id}",
                    palette=get_default_series_palette(seed),
                    geometry=get_default_series_geometry(seed),
                )
                db.add(series)
                created += 1
        
        db.commit()
        print(f"Created {created} default series")
    except Exception as e:
        db.rollback()
        print(f"Error creating series: {e}")
        raise
    finally:
        db.close()


def backfill_visual_versions():
    """Set visual_version=1 for existing tracks"""
    db = SessionLocal()
    try:
        tracks = db.query(Track).filter(
            (Track.visual_version.is_(None)) | (Track.visual_version == 0)
        ).all()
        for track in tracks:
            track.visual_version = 1
        db.commit()
        print(f"Backfilled {len(tracks)} track visual versions")
    except Exception as e:
        db.rollback()
        print(f"Error backfilling versions: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("Starting style seed backfill...")
    backfill_style_seeds()
    backfill_default_series()
    backfill_visual_versions()
    print("Backfill complete!")

