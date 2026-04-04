from typing import Dict, Any

# In-memory dictionary to store job statuses
# For production/scale, replace with Redis or PostgreSQL
_JOBS: Dict[str, Any] = {}

def start_job(job_id: str):
    _JOBS[job_id] = {"status": "processing", "result": None, "error": None}

def get_job(job_id: str) -> Any:
    return _JOBS.get(job_id)

def update_job_success(job_id: str, result: dict):
    if job_id in _JOBS:
        _JOBS[job_id]["status"] = "done"
        _JOBS[job_id]["result"] = result

def update_job_error(job_id: str, error_msg: str):
    if job_id in _JOBS:
        _JOBS[job_id]["status"] = "error"
        _JOBS[job_id]["error"] = error_msg
