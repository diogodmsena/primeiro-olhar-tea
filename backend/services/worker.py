import os
import json
from celery import Celery
from services.gemma_explainability import analyze_multimodal_case
from utils.storage import update_job_success, update_job_error
from utils.logger import get_logger

logger = get_logger(__name__)


REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")


celery_app = Celery(
    "triagem_worker",
    broker=REDIS_URL,
    backend=REDIS_URL
)


celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)

@celery_app.task(name="process_video_task", bind=True, max_retries=3)
def process_video_task(self, job_id: str, parent_json: str, video_path: str):
    """
    Celery task to run the Gemma 4 pipeline.
    """
    try:
        logger.info(f"Starting Gemma 4 pipeline via Celery for job {job_id}")
        parent_answers = json.loads(parent_json)
        
        # Run the hybrid pipeline
        # Phase 1 (Local CV) -> Phase 2 (Upload) -> Phase 3 (Gemma 4) -> Phase 4 (Parse)
        report_data = analyze_multimodal_case(video_path, parent_answers)
        

        update_job_success(job_id, {
            "child_name": parent_answers.get("child_name", ""),
            "video_features": report_data.get("video_features", {}),
            "audio_features": report_data.get("audio_features", {}),
            "text_features": report_data.get("text_features", {}),
            "risk_score": report_data.get("risk_score", {"score": 0.0, "level": "Indefinido"}),
            "gemma_report": report_data.get("gemma_report", "Relatório Indisponível."),
            "clinical_reasoning": report_data.get("clinical_reasoning", ""),
        })
        
        logger.info(f"Job {job_id} completed successfully via Celery")
        return {"status": "success", "job_id": job_id}

    except Exception as exc:
        logger.error(f"Error processing job {job_id} in worker: {str(exc)}")
        # Transient errors (e.g., network timeout) can be retried here.
        # self.retry(exc=exc, countdown=60)
        update_job_error(job_id, str(exc))
        return {"status": "error", "job_id": job_id, "error": str(exc)}
