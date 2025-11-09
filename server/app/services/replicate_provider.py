"""
Replicate MiniMax Music provider implementation (fallback)
"""
import os
import replicate
from typing import Optional
from app.services.model_provider import ModelProvider


class ReplicateProvider(ModelProvider):
    """Replicate MiniMax Music provider (fallback)"""

    def __init__(self):
        api_token = os.getenv("REPLICATE_API_TOKEN")
        if not api_token:
            raise ValueError("REPLICATE_API_TOKEN environment variable not set")
        self.client = replicate.Client(api_token=api_token)
        self.model = "minimax/music-1.5"

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
        Generate music using Replicate MiniMax Music model
        """
        # Replicate has max 240s duration
        duration_s = min(duration_s, 240)

        input_params = {
            "prompt": prompt,
            "duration": duration_s,
            "style_strength": style_strength,
        }

        if lyrics:
            input_params["lyrics"] = lyrics
            input_params["has_vocals"] = True

        if seed is not None:
            input_params["seed"] = seed

        if reference_url:
            input_params["reference_audio"] = reference_url

        # Run prediction
        output = self.client.run(
            self.model,
            input=input_params,
        )

        # Replicate returns a list of URLs
        if isinstance(output, list) and len(output) > 0:
            file_url = output[0]
        elif isinstance(output, str):
            file_url = output
        else:
            raise Exception(f"Unexpected output format from Replicate: {output}")

        return {
            "file_url": file_url,
            "provider": "replicate",
        }

