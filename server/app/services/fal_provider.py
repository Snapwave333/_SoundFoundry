"""
FAL.ai MiniMax Music v2 provider implementation using fal-client
"""
import os
import logging
from typing import Optional
from app.services.model_provider import ModelProvider

try:
    import fal_client
    FAL_CLIENT_AVAILABLE = True
except ImportError:
    FAL_CLIENT_AVAILABLE = False

logger = logging.getLogger(__name__)

FAL_MODEL = "fal-ai/minimax-music/v2"


class FALProvider(ModelProvider):
    """FAL.ai MiniMax Music v2 provider using fal-client library"""

    def __init__(self):
        if not FAL_CLIENT_AVAILABLE:
            raise ValueError("fal-client library not installed. Run: pip install fal-client")
        
        # Get FAL key - prefer FAL_KEY, fallback to FAL_API_KEY
        self.api_key = self._get_fal_key()
        if not self.api_key:
            raise ValueError("FAL_KEY or FAL_API_KEY environment variable not set")
        
        # Set API key in environment for fal-client (it reads from FAL_KEY env var)
        os.environ["FAL_KEY"] = self.api_key
    
    @staticmethod
    def _get_fal_key():
        """Get FAL API key, preferring FAL_KEY over FAL_API_KEY"""
        return os.getenv("FAL_KEY") or os.getenv("FAL_API_KEY")

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
        Generate music using FAL.ai MiniMax Music v2 via fal-client
        """
        # Normalize inputs
        inputs = {
            "prompt": prompt,
            "duration": max(5, min(240, int(duration_s))),
            "style_strength": float(max(0.0, min(1.0, style_strength))),
        }

        if lyrics:
            inputs["lyrics"] = lyrics

        if seed is not None:
            inputs["seed"] = seed

        if reference_url:
            inputs["reference_audio_url"] = reference_url

        try:
            # Use fal-client's run method (synchronous)
            # Mask API key in logs (show only prefix)
            key_prefix = self.api_key[:8] + "..." if self.api_key and len(self.api_key) > 8 else "***"
            logger.info(f"Calling FAL model {FAL_MODEL} with inputs: {list(inputs.keys())} (key: {key_prefix})")
            result = fal_client.run(FAL_MODEL, arguments=inputs)
            
            # Extract audio URL from result
            # Result structure may vary; check for common fields
            file_url = None
            if isinstance(result, dict):
                file_url = result.get("audio_url") or result.get("audio") or result.get("url")
            elif isinstance(result, list) and len(result) > 0:
                file_url = result[0] if isinstance(result[0], str) else result[0].get("url")
            
            if not file_url:
                raise Exception(f"FAL API returned unexpected result format: {type(result)}")
            
            return {
                "file_url": file_url,
                "provider": "fal",
            }
        except Exception as e:
            error_msg = str(e)
            # Check for authentication errors
            if "403" in error_msg or "401" in error_msg or "Forbidden" in error_msg:
                logger.error(f"FAL API authentication failed: {error_msg}")
                raise Exception(
                    f"FAL API authentication failed. Check FAL_KEY/FAL_API_KEY environment variable. "
                    f"Error: {error_msg}"
                )
            raise

