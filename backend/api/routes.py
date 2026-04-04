from fastapi import APIRouter, File, UploadFile, Form, BackgroundTasks
import uuid
import json
from api.models import ProcessJobResponse, ProcessJobResponse, FinalReportResponse, ParentQuestions
from utils.storage import start_job, get_job, update_job_success, update_job_error
from utils.logger import get_logger
from services.video_processor import process_video
from services.audio_processor import process_audio
from services.text_processor import process_text
from services.risk_engine import calculate_risk
from services.gemma_explainability import generate_report

router = APIRouter()
logger = get_logger(__name__)

def orchestration_pipeline(job_id: str, parent_json: str):
    try:
        logger.info(f"Starting pipeline for job {job_id}")
        # Parse text logic
        parent_answers = json.loads(parent_json)
        
        # 1. Processors (Mocked for speed in phase 1)
        video_feats = process_video()
        audio_feats = process_audio()
        text_feats = process_text(parent_answers)
        
        # 2. Risk Engine
        risk_out = calculate_risk(video_feats, audio_feats, text_feats)
        
        # 3. Gemma Explainability (LLM)
        report = generate_report(video_feats, audio_feats, text_feats, risk_out)
        
        # Save to memory storage
        update_job_success(job_id, {
            "video_features": video_feats,
            "audio_features": audio_feats,
            "text_features": text_feats,
            "risk_score": risk_out,
            "gemma_report": report
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
    
    # Enqueue background task
    background_tasks.add_task(orchestration_pipeline, job_id, parent_answers)
    
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
