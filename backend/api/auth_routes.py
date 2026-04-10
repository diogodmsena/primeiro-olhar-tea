from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional
import json
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from utils.database import upsert_user, save_report, get_user_reports, get_user_by_google_id
from utils.logger import get_logger
import os
import jwt
import time

logger = get_logger(__name__)

auth_router = APIRouter()

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
JWT_SECRET = os.getenv("JWT_SECRET", "primeiro-olhar-secret-key-2026")

class GoogleAuthRequest(BaseModel):
    token: str

class SaveReportRequest(BaseModel):
    job_id: str
    report_data: dict

def create_session_token(user_id: int, google_id: str) -> str:
    payload = {
        "user_id": user_id,
        "google_id": google_id,
        "iat": int(time.time()),
        "exp": int(time.time()) + 86400 * 30,  # 30 days
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

def verify_session_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def get_user_from_token(authorization: str) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token de autorização necessário")
    
    token = authorization.replace("Bearer ", "")
    
    # Try as session token first
    session = verify_session_token(token)
    if session:
        user = get_user_by_google_id(session["google_id"])
        if user:
            return user

    # Try as Google ID token (fallback)
    try:
        idinfo = id_token.verify_oauth2_token(token, google_requests.Request(), GOOGLE_CLIENT_ID)
        user = get_user_by_google_id(idinfo["sub"])
        if user:
            return user
    except Exception:
        pass

    raise HTTPException(status_code=401, detail="Token inválido ou expirado")

@auth_router.post("/auth/google")
async def google_auth(req: GoogleAuthRequest):
    try:
        if GOOGLE_CLIENT_ID:
            idinfo = id_token.verify_oauth2_token(
                req.token, google_requests.Request(), GOOGLE_CLIENT_ID
            )
        else:
            # Development mode: decode without verification
            import base64
            payload_b64 = req.token.split('.')[1]
            padding = 4 - len(payload_b64) % 4
            if padding != 4:
                payload_b64 += '=' * padding
            idinfo = json.loads(base64.urlsafe_b64decode(payload_b64))
            logger.warning("GOOGLE_CLIENT_ID not set - using unverified token (dev mode)")

        google_id = idinfo.get("sub", "")
        email = idinfo.get("email", "")
        name = idinfo.get("name", "")
        picture = idinfo.get("picture", "")

        if not google_id or not email:
            raise HTTPException(status_code=400, detail="Token inválido")

        user_id = upsert_user(google_id, email, name, picture)
        session_token = create_session_token(user_id, google_id)

        logger.info(f"User authenticated: {email} (id={user_id})")
        
        return {
            "session_token": session_token,
            "user": {
                "id": user_id,
                "email": email,
                "name": name,
                "picture": picture,
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Google auth error: {e}")
        raise HTTPException(status_code=401, detail="Falha na autenticação Google")

@auth_router.get("/reports")
async def list_reports(authorization: str = Header(default="")):
    user = get_user_from_token(authorization)
    reports = get_user_reports(user["id"])
    return {"reports": reports}

@auth_router.post("/reports")
async def create_report(req: SaveReportRequest, authorization: str = Header(default="")):
    user = get_user_from_token(authorization)
    
    risk_score = 0.0
    risk_level = "INDEFINIDO"
    
    if "risk_score" in req.report_data:
        rs = req.report_data["risk_score"]
        if isinstance(rs, dict):
            risk_score = rs.get("score", 0.0)
            risk_level = rs.get("level", "INDEFINIDO")

    report_id = save_report(
        user_id=user["id"],
        job_id=req.job_id,
        report_data=req.report_data,
        risk_score=risk_score,
        risk_level=risk_level,
    )
    
    return {"id": report_id, "message": "Relatório salvo com sucesso"}
