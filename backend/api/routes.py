from fastapi import APIRouter, File, UploadFile, Form, BackgroundTasks
import uuid
import json
from api.models import ProcessJobResponse, ProcessJobResponse, FinalReportResponse, ParentQuestions
from utils.storage import start_job, get_job, update_job_success, update_job_error
from utils.logger import get_logger
from services.gemma_explainability import analyze_multimodal_case
import os
import shutil

router = APIRouter()
logger = get_logger(__name__)

def orchestration_pipeline(job_id: str, parent_json: str, video_path: str):
    try:
        logger.info(f"Starting pipeline for job {job_id}")
        parent_answers = json.loads(parent_json)
        
        # Super-Model Integrado: Envia o vídeo inteiro + Formulario para o Gemini Flash Native
        report_data = analyze_multimodal_case(video_path, parent_answers)
        
        # Save to memory storage
        update_job_success(job_id, {
            "video_features": report_data.get("video_features", {"avg_gaze_score": 1.0, "eye_contact_ratio": 1.0, "head_movement_pattern": "normal", "facial_expressivity": "normal"}),
            "audio_features": report_data.get("audio_features", {"prosody_variation": 1.0, "speech_presence": True, "audio_reactivity": "normal"}),
            "text_features": report_data.get("text_features", {"parent_concerns": [], "contextual_flags": []}),
            "risk_score": report_data.get("risk_score", {"score": 0.0, "level": "Indefinido"}),
            "gemma_report": report_data.get("gemma_report", "Relatório Indisponível.")
        })
        logger.info(f"Job {job_id} completed successfully")
    except Exception as e:
        logger.error(f"Error processing job {job_id}: {str(e)}")
        update_job_error(job_id, str(e))

@router.post("/triagem", response_model=ProcessJobResponse)
async def create_triagem(
    background_tasks: BackgroundTasks,
    video: UploadFile = File(...),
    parent_answers: str = Form(...) 
):
    """
    Receives video and parent questionnaire, starts background processing.
    """
    job_id = str(uuid.uuid4())
    start_job(job_id)
    
    # Save the physical payload to Docker's internal /tmp space for file-uploading
    os.makedirs("/tmp/triagem_videos", exist_ok=True)
    video_path = f"/tmp/triagem_videos/{job_id}_{video.filename}"
    
    with open(video_path, "wb") as buffer:
        shutil.copyfileobj(video.file, buffer)
    
    # Enqueue background task
    background_tasks.add_task(orchestration_pipeline, job_id, parent_answers, video_path)
    
    return ProcessJobResponse(job_id=job_id, status="processing", message="Triagem iniciada.")

@router.get("/triagem/{job_id}", response_model=FinalReportResponse)
async def get_triagem_status(job_id: str):
    """
    Checks status. If done, returns the full report.
    """
    job_data = get_job(job_id)
    if not job_data:
        return FinalReportResponse(job_id=job_id, status="not_found")
        
    status = job_data["status"]
    
    if status == "processing":
        return FinalReportResponse(job_id=job_id, status="processing")
    
    # Done state
    result = job_data.get("result", {})
    return FinalReportResponse(
        job_id=job_id,
        status="done",
        video_features=result.get("video_features"),
        audio_features=result.get("audio_features"),
        text_features=result.get("text_features"),
        risk_score=result.get("risk_score"),
        gemma_report=result.get("gemma_report")
    )
