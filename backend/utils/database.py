import sqlite3
import json
import os
from datetime import datetime
from utils.logger import get_logger

logger = get_logger(__name__)

DB_PATH = os.getenv("DB_PATH", "/app/data/triagem.db")

def get_connection():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            google_id TEXT UNIQUE NOT NULL,
            email TEXT NOT NULL,
            name TEXT NOT NULL,
            picture TEXT DEFAULT '',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            job_id TEXT NOT NULL,
            report_data TEXT NOT NULL,
            risk_score REAL DEFAULT 0,
            risk_level TEXT DEFAULT 'INDEFINIDO',
            child_name TEXT DEFAULT '',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)

    # Jobs table for persistent background-task state (survives restarts)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS jobs (
            job_id       TEXT PRIMARY KEY,
            status       TEXT NOT NULL DEFAULT 'processing',
            result_json  TEXT,
            error        TEXT,
            metadata_json TEXT,
            created_at   TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at   TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Incremental schema migrations (idempotent)
    for migration in [
        "ALTER TABLE reports ADD COLUMN child_name TEXT DEFAULT ''",
        "ALTER TABLE reports ADD COLUMN clinical_reasoning TEXT DEFAULT ''",
    ]:
        try:
            cursor.execute(migration)
        except sqlite3.OperationalError:
            pass  # column already exists
    
    conn.commit()
    conn.close()
    logger.info(f"Database initialized at {DB_PATH}")

def upsert_user(google_id: str, email: str, name: str, picture: str = "") -> int:
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT id FROM users WHERE google_id = ?", (google_id,))
    row = cursor.fetchone()
    
    if row:
        cursor.execute(
            "UPDATE users SET email = ?, name = ?, picture = ? WHERE google_id = ?",
            (email, name, picture, google_id)
        )
        user_id = row["id"]
    else:
        cursor.execute(
            "INSERT INTO users (google_id, email, name, picture) VALUES (?, ?, ?, ?)",
            (google_id, email, name, picture)
        )
        user_id = cursor.lastrowid
    
    conn.commit()
    conn.close()
    return user_id

def save_report(user_id: int, job_id: str, report_data: dict, risk_score: float, risk_level: str, child_name: str = "") -> int:
    conn = get_connection()
    cursor = conn.cursor()
    
    # Check if already saved
    cursor.execute(
        "SELECT id FROM reports WHERE user_id = ? AND job_id = ?",
        (user_id, job_id)
    )
    existing = cursor.fetchone()
    if existing:
        # Update with new data (handles cases where a retried job replaces an error payload)
        report_id = existing["id"]
        cursor.execute(
            """
            UPDATE reports 
            SET report_data = ?, risk_score = ?, risk_level = ?, child_name = ?
            WHERE id = ?
            """,
            (json.dumps(report_data), risk_score, risk_level, child_name, report_id)
        )
        conn.commit()
        conn.close()
        logger.info(f"Report updated: user_id={user_id}, job_id={job_id}")
        return report_id
    
    cursor.execute(
        "INSERT INTO reports (user_id, job_id, report_data, risk_score, risk_level, child_name) VALUES (?, ?, ?, ?, ?, ?)",
        (user_id, job_id, json.dumps(report_data), risk_score, risk_level, child_name)
    )
    report_id = cursor.lastrowid
    conn.commit()
    conn.close()
    logger.info(f"Report saved: user_id={user_id}, job_id={job_id}")
    return report_id

def get_user_reports(user_id: int) -> list:
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute(
        "SELECT id, job_id, risk_score, risk_level, child_name, created_at FROM reports WHERE user_id = ? ORDER BY created_at DESC",
        (user_id,)
    )
    rows = cursor.fetchall()
    conn.close()
    
    return [dict(row) for row in rows]

def get_user_by_google_id(google_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE google_id = ?", (google_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def delete_user_report(user_id: int, job_id: str) -> bool:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "DELETE FROM reports WHERE user_id = ? AND job_id = ?",
        (user_id, job_id)
    )
    affected = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return affected

def get_report_by_job_id(job_id: str) -> dict:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM reports WHERE job_id = ?", (job_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


# ---------------------------------------------------------------------------
# Job persistence helpers (used by utils/storage.py)
# ---------------------------------------------------------------------------

def upsert_job(
    job_id: str,
    status: str,
    result_json: str | None = None,
    error: str | None = None,
    metadata_json: str | None = None,
) -> None:
    """Insert or update a row in the jobs table."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO jobs (job_id, status, result_json, error, metadata_json, updated_at)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(job_id) DO UPDATE SET
            status        = excluded.status,
            result_json   = excluded.result_json,
            error         = excluded.error,
            metadata_json = COALESCE(excluded.metadata_json, jobs.metadata_json),
            updated_at    = CURRENT_TIMESTAMP
        """,
        (job_id, status, result_json, error, metadata_json),
    )
    conn.commit()
    conn.close()


def get_job_by_id(job_id: str) -> dict | None:
    """Fetch a job row by job_id."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM jobs WHERE job_id = ?", (job_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None
