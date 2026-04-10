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
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)
    
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

def save_report(user_id: int, job_id: str, report_data: dict, risk_score: float, risk_level: str) -> int:
    conn = get_connection()
    cursor = conn.cursor()
    
    # Check if already saved
    cursor.execute(
        "SELECT id FROM reports WHERE user_id = ? AND job_id = ?",
        (user_id, job_id)
    )
    existing = cursor.fetchone()
    if existing:
        conn.close()
        return existing["id"]
    
    cursor.execute(
        "INSERT INTO reports (user_id, job_id, report_data, risk_score, risk_level) VALUES (?, ?, ?, ?, ?)",
        (user_id, job_id, json.dumps(report_data), risk_score, risk_level)
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
        "SELECT id, job_id, risk_score, risk_level, created_at FROM reports WHERE user_id = ? ORDER BY created_at DESC",
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
