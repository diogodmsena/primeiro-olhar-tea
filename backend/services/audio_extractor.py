import librosa
import numpy as np
import os
from utils.logger import get_logger

logger = get_logger(__name__)

class AudioFeatureExtractor:
    """
    Extracts quantitative audio metrics from a screening video using librosa.
    This runs locally on the backend before the audio is stripped for Gemma 4.
    """
    
    def extract_features(self, video_path: str) -> dict:
        """
        Extracts speech and prosody features from the audio track of the video.
        """
        try:
            logger.info(f"Extracting audio features from {video_path}")
            
            # Load audio using librosa
            # Note: librosa uses audioread which handles most video formats if ffmpeg is present
            y, sr = librosa.load(video_path, sr=None)
            
            if len(y) == 0:
                logger.warning("Empty audio track detected.")
                return self._get_default_features()

            # 1. Speech Presence (Signal-to-Noise Ratio proxy or Energy threshold)
            # We use non-silent intervals
            intervals = librosa.effects.split(y, top_db=25)
            speech_duration = sum([end - start for start, end in intervals]) / sr
            total_duration = len(y) / sr
            speech_presence = speech_duration > 0.5 # boolean flag if more than 0.5s of audio
            
            # 2. Prosody Variation (Pitch variance as a proxy)
            # We use the standard deviation of the fundamental frequency (F0)
            pitches, magnitudes = librosa.piptrack(y=y, sr=sr)
            # Extract dominant pitches
            pitch_values = []
            for i in range(pitches.shape[1]):
                index = magnitudes[:, i].argmax()
                pitch = pitches[index, i]
                if pitch > 0:
                    pitch_values.append(pitch)
            
            prosody_variation = 0.5 # Default middle
            if len(pitch_values) > 10:
                # Normalize std dev to a 0.0 - 1.0 range (simplified)
                std_pitch = np.std(pitch_values)
                # Heuristic: 0-100Hz variation is common. 0.0 = monotone, 1.0 = highly melodic/varied
                prosody_variation = min(1.0, std_pitch / 150.0)

            # 3. Audio Reactivity (Response time/dynamics)
            # Simplified: change in energy levels
            rms = librosa.feature.rms(y=y)[0]
            rms_variance = np.var(rms)
            audio_reactivity = "normal"
            if rms_variance > 0.01:
                audio_reactivity = "high"
            elif rms_variance < 0.0005:
                audio_reactivity = "low"

            logger.info(f"Audio features: speech={speech_presence}, prosody={prosody_variation:.2f}, reactivity={audio_reactivity}")

            return {
                "prosody_variation": round(float(prosody_variation), 2),
                "speech_presence": bool(speech_presence),
                "audio_reactivity": audio_reactivity,
                "speech_ratio": round(float(speech_duration / total_duration), 2) if total_duration > 0 else 0
            }

        except Exception as e:
            logger.error(f"Failed to extract audio features: {str(e)}")
            return self._get_default_features()

    def _get_default_features(self) -> dict:
        return {
            "prosody_variation": 0.5,
            "speech_presence": False,
            "audio_reactivity": "normal",
            "speech_ratio": 0.0
        }
