"""
Audio analysis service using librosa
"""
import librosa
import numpy as np
from typing import Optional, Dict
import tempfile
import os


class AudioAnalyzer:
    """Service for analyzing audio files"""

    def analyze(self, file_path: str) -> Dict[str, Optional[float]]:
        """
        Analyze audio file and extract BPM, key, energy, loudness
        """
        try:
            # Load audio file
            y, sr = librosa.load(file_path, duration=60)  # Analyze first 60 seconds

            # BPM detection
            tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
            bpm = int(round(tempo))

            # Key detection (simplified - librosa doesn't have built-in key detection)
            # Using chroma features as a proxy
            chroma = librosa.feature.chroma_stft(y=y, sr=sr)
            chroma_mean = np.mean(chroma, axis=1)
            key_index = np.argmax(chroma_mean)
            keys = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
            key = keys[key_index]

            # Energy (RMS)
            rms = librosa.feature.rms(y=y)[0]
            energy = float(np.mean(rms))

            # Loudness (LUFS approximation using RMS)
            # For accurate LUFS, would need EBU R128 implementation
            loudness = float(np.mean(rms) * 20)  # Approximate conversion

            return {
                "bpm": bpm,
                "key": key,
                "energy": energy,
                "loudness": loudness,
            }
        except Exception as e:
            # Return None values on error
            return {
                "bpm": None,
                "key": None,
                "energy": None,
                "loudness": None,
            }

    def analyze_from_url(self, url: str) -> Dict[str, Optional[float]]:
        """Download audio from URL and analyze"""
        import httpx
        import tempfile

        with httpx.Client() as client:
            response = client.get(url)
            response.raise_for_status()

            with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as tmp_file:
                tmp_file.write(response.content)
                tmp_path = tmp_file.name

            try:
                return self.analyze(tmp_path)
            finally:
                os.unlink(tmp_path)


# Singleton instance
_audio_analyzer: Optional[AudioAnalyzer] = None


def get_audio_analyzer() -> AudioAnalyzer:
    """Get or create audio analyzer instance"""
    global _audio_analyzer
    if _audio_analyzer is None:
        _audio_analyzer = AudioAnalyzer()
    return _audio_analyzer

