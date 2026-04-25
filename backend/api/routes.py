from fastapi import APIRouter, File, UploadFile, Form, BackgroundTasks, HTTPException
import uuid
import json
import tempfile
from api.models import ProcessJobResponse, ProcessJobResponse, FinalReportResponse, ParentQuestions
from utils.storage import start_job, get_job, update_job_success, update_job_error, reset_job_to_processing
from utils.logger import get_logger
from services.gemma_explainability import analyze_multimodal_case, translate_report
import os
import shutil
from pydantic import BaseModel

router = APIRouter()
logger = get_logger(__name__)

def orchestration_pipeline(job_id: str, parent_json: str, video_path: str):
    try:
        logger.info(f"Starting Gemma 4 pipeline for job {job_id}")
        parent_answers = json.loads(parent_json)
        
        # Hybrid pipeline: local CV analysis → Gemma 4 multimodal inference
        report_data = analyze_multimodal_case(video_path, parent_answers)
        
        update_job_success(job_id, {
            "child_name": parent_answers.get("child_name", ""),
            "video_features": report_data.get("video_features", {"avg_gaze_score": 1.0, "eye_contact_ratio": 1.0, "head_movement_pattern": "normal", "facial_expressivity": "normal"}),
            "audio_features": report_data.get("audio_features", {"prosody_variation": 1.0, "speech_presence": True, "audio_reactivity": "normal"}),
            "text_features": report_data.get("text_features", {"parent_concerns": [], "contextual_flags": []}),
            "risk_score": report_data.get("risk_score", {"score": 0.0, "level": "Indefinido"}),
            "gemma_report": report_data.get("gemma_report", "Relatório Indisponível."),
            "clinical_reasoning": report_data.get("clinical_reasoning", ""),
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
    
    # Save the physical payload to temp space for file-uploading
    video_dir = os.path.join(tempfile.gettempdir(), "triagem_videos")
    os.makedirs(video_dir, exist_ok=True)
    video_path = os.path.join(video_dir, f"{job_id}_{video.filename}")
    
    with open(video_path, "wb") as buffer:
        shutil.copyfileobj(video.file, buffer)
        
    start_job(job_id, metadata={"parent_answers": parent_answers, "video_path": video_path})
    
    # Enqueue background task
    background_tasks.add_task(orchestration_pipeline, job_id, parent_answers, video_path)
    
    return ProcessJobResponse(job_id=job_id, status="processing", message="Triagem iniciada.")


@router.post("/triagem/{job_id}/retry", response_model=ProcessJobResponse)
async def retry_triagem(
    job_id: str,
    background_tasks: BackgroundTasks
):
    """
    Retries an existing job that failed, using the same stored video and answers.
    """
    job_data = get_job(job_id)
    if not job_data:
        raise HTTPException(status_code=404, detail="Job not found")
        
    metadata = job_data.get("metadata", {})
    video_path = metadata.get("video_path")
    parent_answers = metadata.get("parent_answers")
    
    if not video_path or not parent_answers or not os.path.exists(video_path):
        raise HTTPException(status_code=400, detail="Cannot retry: Original files or payload missing from memory")
        
    reset_job_to_processing(job_id)
    background_tasks.add_task(orchestration_pipeline, job_id, parent_answers, video_path)
    
    return ProcessJobResponse(job_id=job_id, status="processing", message="Triagem reiniciada.")

@router.get("/triagem/{job_id}", response_model=FinalReportResponse)
async def get_triagem_status(job_id: str):
    """
    Checks status. If done, returns the full report.
    """
    job_data = get_job(job_id)
    if not job_data:
        from utils.database import get_report_by_job_id
        saved_report = get_report_by_job_id(job_id)
        if saved_report:
            try:
                report_data = json.loads(saved_report.get("report_data", "{}"))
                return FinalReportResponse(
                    job_id=job_id,
                    status="done",
                    video_features=report_data.get("video_features"),
                    audio_features=report_data.get("audio_features"),
                    text_features=report_data.get("text_features"),
                    risk_score=report_data.get("risk_score"),
                    gemma_report=report_data.get("gemma_report"),
                    clinical_reasoning=report_data.get("clinical_reasoning"),
                    child_name=report_data.get("child_name", saved_report.get("child_name", ""))
                )
            except Exception as e:
                logger.error(f"Failed to parse database report for {job_id}: {e}")
        return FinalReportResponse(job_id=job_id, status="not_found")
        
    status = job_data["status"]
    
    if status == "processing":
        return FinalReportResponse(job_id=job_id, status="processing")
    
    if status == "error":
        return FinalReportResponse(
            job_id=job_id, 
            status="error",
            error_message=job_data.get("error", "Erro desconhecido no processamento.")
        )
    
    # Done state
    result = job_data.get("result", {})
    return FinalReportResponse(
        job_id=job_id,
        status="done",
        video_features=result.get("video_features"),
        audio_features=result.get("audio_features"),
        text_features=result.get("text_features"),
        risk_score=result.get("risk_score"),
        gemma_report=result.get("gemma_report"),
        clinical_reasoning=result.get("clinical_reasoning"),
        child_name=result.get("child_name", "")
    )

class TranslateRequest(BaseModel):
    target_lang: str

@router.post("/triagem/{job_id}/translate")
async def translate_triagem_report(job_id: str, request: TranslateRequest):
    """
    Translates the gemma_report markdown into the requested target_lang.
    """
    job_data = get_job(job_id)
    report_text = None
    
    if not job_data:
        from utils.database import get_report_by_job_id
        saved_report = get_report_by_job_id(job_id)
        if saved_report:
            try:
                report_data = json.loads(saved_report.get("report_data", "{}"))
                report_text = report_data.get("gemma_report")
            except Exception:
                pass
    else:
        result = job_data.get("result", {})
        report_text = result.get("gemma_report")
        
    if not report_text:
        raise HTTPException(status_code=404, detail="Original report not found")
        
    translated_text = await translate_report(report_text, request.target_lang)
    return {"translated_report": translated_text}
