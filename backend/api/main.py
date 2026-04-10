from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import router as api_router
from api.auth_routes import auth_router
from utils.database import init_db

app = FastAPI(title="Gemma-4-Good MVP API", version="1.0.0")

# Allow CORS for NextJS frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For Hackathon MVP
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")
app.include_router(auth_router, prefix="/api")

@app.on_event("startup")
def startup():
    init_db()

@app.get("/")
def read_root():
    return {"message": "Gemma-4-Good API Online"}
