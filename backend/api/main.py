from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from api.routes import router as api_router
from api.auth_routes import auth_router
from utils.database import init_db
import traceback
from utils.logger import get_logger

logger = get_logger(__name__)

app = FastAPI(title="Gemma-4-Good MVP API", version="1.0.0")

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled Exception: {exc}\n{traceback.format_exc()}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error", "error": str(exc)},
        headers={"Access-Control-Allow-Origin": "*"}
    )


origins = [
    "http://localhost:3000",
    "https://primeiroolhar.app.br",
    "https://api.primeiroolhar.app.br"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["Cross-Origin-Opener-Policy"] = "same-origin-allow-popups"
    return response


app.include_router(api_router, prefix="/api")
app.include_router(auth_router, prefix="/api")

@app.on_event("startup")
def startup():
    init_db()

@app.get("/")
def read_root():
    return {"message": "Gemma-4-Good API Online"}
