# Backend & AI Engine — Primeiro Olhar 🧠

The Python-based API and asynchronous AI processing engine that powers the "Primeiro Olhar" screening platform.

## Role in the Mission

This module is the **brain** of Primeiro Olhar. When a family uploads a 30-second video of their child, it is this engine that orchestrates the entire analysis pipeline — from extracting visual gaze metrics and audio prosody patterns locally, to dispatching the multimodal data to **Gemma 4** for clinical-grade behavioral reasoning. The result is a structured, empathetic report generated in seconds, breaking down what would normally require weeks of specialist appointments into an accessible, immediate first look.

---

## Quick Start

The easiest way to run the backend and its worker is using Docker from the project root. Alternatively, to run it natively:

```bash
# 1. Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows use: .venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Start Redis (requires a local Redis server or Docker)
docker run -d -p 6379:6379 redis:alpine

# 4. Start the FastAPI server
fastapi dev main.py

# 5. In a separate terminal, start the Celery worker
celery -A services.worker.celery_app worker --loglevel=info
```

## Features

- **Asynchronous Pipeline**: Uses Celery and Redis to handle heavy video processing without blocking the HTTP thread.
- **Multimodal AI Integration**: Interacts directly with Gemma 4 to analyze videos and parental texts using Chain-of-Thought reasoning.
- **Computer Vision & Audio Processing**: Extracts eye contact metrics (MediaPipe), audio prosody (Librosa), and facial expressivity locally before AI inference.
- **REST API**: Provides structured endpoints for the frontend and mobile apps.

## Configuration

Create a `.env` file in the `backend/` directory:

| Variable | Description | Default |
|----------|-------------|---------|
| `GEMINI_API_KEY` | Your Google Gemini API Key | `None` (Required) |
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379/0` |
| `CELERY_BROKER_URL`| Celery Broker URL | `redis://localhost:6379/0` |
| `CELERY_RESULT_BACKEND`| Celery Result Backend | `redis://localhost:6379/0` |

## API Reference

### POST `/triagem/upload`
Initiates the screening process by uploading a video and parental observations.

**Parameters (Multipart/form-data):**
- `file` (File): The video file (MP4/MOV).
- `child_name` (String): Name of the child.
- `observations` (String): JSON string containing parental observations and questions.
- `lang` (String): Preferred language for the report (`pt`, `en`, `es`).

**Response:**
- `202 Accepted`: Returns a `job_id` to poll for results.

### GET `/triagem/{job_id}?lang={lang}`
Retrieves the status and result of a specific screening job.

**Response:**
- `200 OK`: Returns the job status (`pending`, `processing`, `completed`, `failed`) and the AI report if completed.

## License

This Writeup has been released under the Attribution 4.0 International (CC BY 4.0) license.
