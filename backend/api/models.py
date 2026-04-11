from pydantic import BaseModel
from typing import List, Optional

class ParentQuestions(BaseModel):
    child_name: str
    concerns: str
    communication_delays: str
    responds_to_name: str

class ProcessJobResponse(BaseModel):
    job_id: str
    status: str
    message: str

class VideoFeatureOutput(BaseModel):
    avg_gaze_score: float
    eye_contact_ratio: float
    head_movement_pattern: str
    facial_expressivity: str

class AudioFeatureOutput(BaseModel):
    prosody_variation: float
    speech_presence: bool
    audio_reactivity: str

class TextFeatureOutput(BaseModel):
    parent_concerns: List[str]
    contextual_flags: List[str]

class RiskScoreOutput(BaseModel):
    score: float
    level: str

class FinalReportResponse(BaseModel):
    job_id: str
    status: str
    error_message: Optional[str] = None
    video_features: Optional[VideoFeatureOutput] = None
    audio_features: Optional[AudioFeatureOutput] = None
    text_features: Optional[TextFeatureOutput] = None
    risk_score: Optional[RiskScoreOutput] = None
    gemma_report: Optional[str] = None
    child_name: Optional[str] = None
