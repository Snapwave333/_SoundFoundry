"""
Style seed utilities for deterministic user visual signatures
"""
import hashlib
from typing import Optional
from datetime import datetime


def derive_style_seed(email: str, created_at: datetime) -> int:
    """
    Derive deterministic style seed from user identity.
    
    Args:
        email: User email (will be lowercased)
        created_at: User creation timestamp
        
    Returns:
        uint32 style seed
    """
    if not email or not created_at:
        raise ValueError("Email and created_at are required")
    
    # Use epoch seconds for stable timestamp representation
    epoch_seconds = int(created_at.timestamp())
    
    # Create deterministic hash
    seed_string = f"{email.lower()}{epoch_seconds}"
    hash_bytes = hashlib.sha256(seed_string.encode()).digest()
    
    # Convert to uint32 (first 4 bytes)
    seed = int.from_bytes(hash_bytes[:4], byteorder='big')
    
    # Ensure it's a valid uint32 (0 to 2^32-1)
    return seed % (2**32)


def get_or_create_style_seed(user) -> int:
    """
    Get existing style seed or derive and return it.
    
    Args:
        user: User model instance with email and created_at
        
    Returns:
        uint32 style seed
    """
    if user.user_style_seed is not None:
        return user.user_style_seed
    
    # Derive from user identity
    seed = derive_style_seed(user.email, user.created_at)
    return seed


def compute_style_unlocks(user_id: int, db) -> list[str]:
    """
    Compute style unlocks based on user milestones.
    
    Milestones:
    - FIRST_THREE_TRACKS: User has created 3+ tracks
    - VOCAL_TRACK_CREATED: User has created at least one track with vocals
    - NIGHT_OWL: User has created tracks between 22:00-05:00 local time
    
    Args:
        user_id: User ID
        db: Database session
        
    Returns:
        List of unlock IDs
    """
    from app.models.track import Track
    from app.models.user import User
    
    unlocks = []
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return unlocks
    
    # Get user's tracks
    tracks = db.query(Track).filter(Track.user_id == user_id).all()
    
    # FIRST_THREE_TRACKS
    if len(tracks) >= 3:
        unlocks.append("silk_lines")
    
    # VOCAL_TRACK_CREATED
    if any(track.has_vocals for track in tracks):
        unlocks.append("soft_glow")
    
    # NIGHT_OWL: Check if any track was created between 22:00-05:00 local
    # For simplicity, we'll check UTC hour (can be enhanced with timezone detection)
    night_owl_tracks = [
        track for track in tracks
        if track.created_at and (track.created_at.hour >= 22 or track.created_at.hour < 5)
    ]
    if night_owl_tracks:
        unlocks.append("midnight_bloom")
    
    return unlocks


def update_user_unlocks(user_id: int, db) -> list[str]:
    """
    Compute and update user's style unlocks (set-union with existing).
    
    Args:
        user_id: User ID
        db: Database session
        
    Returns:
        Updated list of unlock IDs
    """
    from app.models.user import User
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return []
    
    # Compute new unlocks
    new_unlocks = compute_style_unlocks(user_id, db)
    
    # Set-union with existing
    existing_unlocks = user.style_unlocks or []
    updated_unlocks = list(set(existing_unlocks + new_unlocks))
    
    # Update user
    user.style_unlocks = updated_unlocks
    db.commit()
    
    return updated_unlocks

