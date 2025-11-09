"""
Abstract model provider interface with auto-fallback
"""
from abc import ABC, abstractmethod
from typing import Optional
import os
import logging

logger = logging.getLogger(__name__)


class ModelProvider(ABC):
    """Abstract base class for music generation providers"""

    @abstractmethod
    def generate(
        self,
        prompt: str,
        duration_s: int,
        lyrics: Optional[str] = None,
        style_strength: float = 0.5,
        seed: Optional[int] = None,
        reference_url: Optional[str] = None,
    ) -> dict:
        """
        Generate music and return result with file_url
        """
        pass


def get_provider(provider_name: Optional[str] = None) -> ModelProvider:
    """
    Factory function to get the appropriate provider with auto-fallback
    
    Args:
        provider_name: "fal", "replicate", or None (uses env var MUSIC_PROVIDER)
    
    Returns:
        ModelProvider instance
        
    Raises:
        ValueError if provider not found and fallback fails
    """
    if provider_name is None:
        provider_name = os.getenv("MUSIC_PROVIDER", "fal").lower()
    
    prefer = provider_name
    
    try:
        if prefer == "fal":
            from app.services.fal_provider import FALProvider
            logger.info("Using FAL provider")
            return FALProvider()
        elif prefer == "replicate":
            from app.services.replicate_provider import ReplicateProvider
            logger.info("Using Replicate provider")
            return ReplicateProvider()
        else:
            raise ValueError(f"Unknown provider: {prefer}")
    except Exception as e:
        # Mask any API keys in error messages
        error_msg = str(e)
        # Replace full keys with masked versions
        import re
        error_msg = re.sub(r'([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}:[a-f0-9]+)', r'\1[:8]...', error_msg)
        logger.error(f"Provider {prefer} failed: {error_msg}", exc_info=True)
        
        # Auto-fallback to Replicate if FAL fails
        if prefer == "fal":
            logger.warning("FAL provider failed, falling back to Replicate")
            try:
                from app.services.replicate_provider import ReplicateProvider
                return ReplicateProvider()
            except Exception as fallback_error:
                logger.error(f"Fallback to Replicate also failed: {fallback_error}")
                raise Exception(
                    f"Primary provider ({prefer}) failed: {e}. "
                    f"Fallback provider (replicate) also failed: {fallback_error}"
                )
        raise

