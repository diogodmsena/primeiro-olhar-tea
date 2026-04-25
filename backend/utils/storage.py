"""
utils/storage.py

Persistent job store backed by SQLite via database.py.

Replaces the old in-memory _JOBS dict.  All state survives container
restarts, which is critical for the background processing pipeline.

The `_JOBS` in-memory cache is kept as a write-through layer so that
hot (in-progress) jobs can be read without hitting the DB on every poll
from the frontend.
"""

from __future__ import annotations

import json
from typing import Any, Dict, Optional

from utils.logger import get_logger

logger = get_logger(__name__)

# Write-through in-memory cache for hot jobs (processing state).
# Completed jobs are read back from SQLite via fallback in get_job().
_JOBS: Dict[str, Any] = {}


# ---------------------------------------------------------------------------
# Internal DB helpers (imported lazily to avoid circular imports)
# ---------------------------------------------------------------------------

def _db():
    """Lazy import of database module."""
    from utils import database
    return database


def _persist_job(job_id: str, status: str, result: Optional[dict], error: Optional[str], metadata: Optional[dict]) -> None:
    """Upsert job row in the jobs SQLite table."""
    try:
        _db().upsert_job(
            job_id=job_id,
            status=status,
            result_json=json.dumps(result) if result else None,
            error=error,
            metadata_json=json.dumps(metadata) if metadata else None,
        )
    except Exception as exc:
        logger.warning("Failed to persist job %s to DB: %s", job_id, exc)


# ---------------------------------------------------------------------------
# Public API (same interface as before — no changes needed in routes.py)
# ---------------------------------------------------------------------------

def start_job(job_id: str, metadata: Optional[dict] = None) -> None:
    """Create a new job in processing state."""
    entry = {
        "status":   "processing",
        "result":   None,
        "error":    None,
        "metadata": metadata or {},
    }
    _JOBS[job_id] = entry
    _persist_job(job_id, "processing", None, None, metadata)


def reset_job_to_processing(job_id: str) -> None:
    """Reset a failed/done job back to processing for retry."""
    if job_id in _JOBS:
        _JOBS[job_id]["status"] = "processing"
        _JOBS[job_id]["error"]  = None
        _JOBS[job_id]["result"] = None
    _persist_job(job_id, "processing", None, None, _JOBS.get(job_id, {}).get("metadata"))


def get_job(job_id: str) -> Optional[dict]:
    """
    Return job data.  Checks in-memory cache first; falls back to SQLite
    for jobs whose in-memory entry was evicted (e.g. after restart).
    """
    if job_id in _JOBS:
        return _JOBS[job_id]

    # Fallback: reload from DB
    try:
        row = _db().get_job_by_id(job_id)
        if row:
            entry = {
                "status":   row["status"],
                "result":   json.loads(row["result_json"]) if row.get("result_json") else None,
                "error":    row.get("error"),
                "metadata": json.loads(row["metadata_json"]) if row.get("metadata_json") else {},
            }
            _JOBS[job_id] = entry   # re-hydrate cache
            return entry
    except Exception as exc:
        logger.warning("Could not reload job %s from DB: %s", job_id, exc)

    return None


def update_job_success(job_id: str, result: dict) -> None:
    """Mark job as done and persist the result."""
    if job_id in _JOBS:
        _JOBS[job_id]["status"] = "done"
        _JOBS[job_id]["result"] = result
    _persist_job(job_id, "done", result, None, _JOBS.get(job_id, {}).get("metadata"))


def update_job_error(job_id: str, error_msg: str) -> None:
    """Mark job as failed and persist the error message."""
    if job_id in _JOBS:
        _JOBS[job_id]["status"] = "error"
        _JOBS[job_id]["error"]  = error_msg
    _persist_job(job_id, "error", None, error_msg, _JOBS.get(job_id, {}).get("metadata"))
