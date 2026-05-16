# Backend - Primeiro Olhar

The Python-based API and asynchronous processing engine for the "Primeiro Olhar" platform.

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
- **Multimodal AI Integration**: Interacts directly with Google Gemini 1.5 Flash to analyze videos and parental texts.
- **Computer Vision & Audio Processing**: Extracts audio tracks (FFmpeg) and analyzes visual frames directly from user uploads.
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
