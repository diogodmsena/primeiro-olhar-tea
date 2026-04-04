import time
from api.models import VideoFeatureOutput

def process_video() -> dict:
    """
    Mock implementation of MediaPipe video processing.
    In a real app, this parses frames, detects faces, gaze, and posture.
    """
    # Simulate processing time
    time.sleep(1)
    
    return {
        "avg_gaze_score": 0.62,
        "eye_contact_ratio": 0.31,
        "head_movement_pattern": "repetitive",
        "facial_expressivity": "low"
    }
