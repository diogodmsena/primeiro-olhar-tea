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
    avg_gaze_score: Optional[float] = 0.0
    eye_contact_ratio: Optional[float] = 0.0
    head_movement_pattern: Optional[str] = "normal"
    facial_expressivity: Optional[str] = "normal"

class AudioFeatureOutput(BaseModel):
    prosody_variation: Optional[float] = 0.0
    speech_presence: Optional[bool] = False
    audio_reactivity: Optional[str] = "normal"

class TextFeatureOutput(BaseModel):
    parent_concerns: Optional[List[str]] = []
    contextual_flags: Optional[List[str]] = []

class RiskScoreOutput(BaseModel):
    score: Optional[float] = 0.0
    level: Optional[str] = "Indefinido"

class FinalReportResponse(BaseModel):
    job_id: str
    status: str
    error_message: Optional[str] = None
    video_features: Optional[VideoFeatureOutput] = None
    audio_features: Optional[AudioFeatureOutput] = None
    text_features: Optional[TextFeatureOutput] = None
    risk_score: Optional[RiskScoreOutput] = None
    gemma_report: Optional[str] = None
    clinical_reasoning: Optional[str] = None
    child_name: Optional[str] = None
