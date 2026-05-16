# Primeiro Olhar 🧩

A welcoming, AI-powered platform for early behavioral screening and identification of Autism Spectrum Disorder (ASD) signs in children.

## Quick Start

You can easily run the core components of the platform locally using Docker.

```bash
# Clone the repository
git clone https://github.com/diogodmsena/primeiro-olhar-tea.git
cd primeiro-olhar-tea

# Start the Backend, AI Worker, and Frontend using Docker Compose
docker-compose up --build -d
```

Once the containers are running:
- **Frontend Web:** [http://localhost:3000](http://localhost:3000)
- **Backend API:** [http://localhost:8000](http://localhost:8000)

*Note: For the mobile application, please see the [Mobile Documentation](./mobile/README.md).*

## Features

- **Multimodal AI Analysis**: Processes video, audio, and parental text responses using Google Gemini Flash to identify behavioral patterns (eye contact, facial expressivity, prosody).
- **Welcoming Interface**: Carefully designed UI to avoid sensory overload (playful & neurodivergent-friendly aesthetics).
- **Asynchronous Processing**: Scalable video analysis powered by Celery and Redis.
- **Cross-Platform Access**: Available as a responsive Web Application and a Mobile App (React Native).
- **Multi-language Support**: Fully internationalized (English, Portuguese, Spanish) for a global reach.

## Configuration

The platform relies on several environment variables. Make sure to configure your `.env` files appropriately based on the module you are running. 

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | API key for Google Gemini model | Yes (Backend) |
| `REDIS_URL` | Redis connection string for Celery | Yes (Backend) |
| `EXPO_PUBLIC_API_URL`| Backend URL for the Mobile app | Yes (Mobile) |

*For detailed configuration, refer to the specific module documentation.*

## Documentation

The project is structured into three main modules. Please refer to their specific documentations for deep dives:

- [Backend & AI Engine](./backend/README.md)
- [Frontend Web App](./frontend/README.md)
- [Mobile Application](./mobile/README.md)

## License

MIT
