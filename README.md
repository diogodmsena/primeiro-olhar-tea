# Primeiro Olhar 🧩

![Hackathon](https://img.shields.io/badge/Built%20for-Gemma%204%20Good%20Hackathon-blue?style=for-the-badge)
![Status](https://img.shields.io/badge/status-active-brightgreen?style=flat-square)
![License](https://img.shields.io/badge/license-CC%20BY%204.0-lightgrey?style=flat-square)
![Platform](https://img.shields.io/badge/platform-Web%20%7C%20Mobile-orange?style=flat-square)

> **"Every child deserves to be seen — and the earlier, the better."**

**Primeiro Olhar** is a multimodal AI-powered platform for early behavioral screening of Autism Spectrum Disorder (ASD) signs in children. This project was **conceived and built exclusively for the Gemma 4 Good Hackathon**, with the mission of using Google's Gemma models to create real, measurable social impact.

---

## 🎯 The Problem

Autism Spectrum Disorder affects **1 in 36 children** worldwide (CDC, 2023). Yet in many countries — especially in underserved communities — **the average age of diagnosis is still around 5 years old**, far beyond the critical early intervention window.

The barriers are real and systemic:
- **Lack of access** to specialized professionals in rural and low-income areas.
- **Long waiting lists** that can take months or even years for an evaluation.
- **Parental uncertainty** — many families notice early signs but don't know if they warrant professional attention.
- **Cultural stigma** that discourages seeking help in many communities.

Every month of delay is a lost opportunity. Research shows that the human brain's neuroplasticity peaks before age 3, making early identification not just important — but **urgent**.

## 💡 Our Solution

Primeiro Olhar bridges the gap between **parental observation and professional evaluation** by providing a free, anonymous, AI-assisted pre-screening tool that families can use from home.

**How it works:**
1. 📹 A caregiver records a **30-second home video** of the child during a natural interaction.
2. 📝 The caregiver answers a brief **behavioral questionnaire** about daily observations.
3. 🤖 Our **Gemma 4 AI engine** analyzes the video (eye contact, facial expressivity), the audio (prosody, speech presence), and the parental text — all simultaneously.
4. 📊 The platform generates a **clear, empathetic report** with visual indicators and actionable next steps — never a diagnosis, always a gentle guide.

The entire process takes under **2 minutes** and requires no medical knowledge from the caregiver.

## 🌍 Why It Matters

- **Early intervention before age 3** can improve developmental outcomes by up to **50%** (NIMH).
- This tool **doesn't replace professionals** — it empowers families to seek the right help at the right time.
- Available in **3 languages** (English, Portuguese, Spanish), designed to reach underserved populations in Latin America and beyond.
- Built with **neurodivergent-friendly design principles**: no sensory overload, no alarming language, no judgmental tone.

> *Primeiro Olhar is not a diagnostic tool. It is a compassionate first step — a "first look" — that can change a child's trajectory.*

---

## 🚀 Quick Start

You can run the full platform locally using Docker:

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

## ✨ Features

- **Multimodal AI Analysis**: Processes video, audio, and parental text responses using Gemma 4 to identify behavioral patterns (eye contact, facial expressivity, prosody).
- **Welcoming Interface**: Carefully designed UI to avoid sensory overload (playful & neurodivergent-friendly aesthetics).
- **Asynchronous Processing**: Scalable video analysis powered by Celery and Redis.
- **Cross-Platform Access**: Available as a responsive Web Application and a Mobile App (React Native).
- **Multi-language Support**: Fully internationalized (English, Portuguese, Spanish) for a global reach.

## ⚙️ Configuration

The platform relies on several environment variables. Configure your `.env` files appropriately based on the module you are running.

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | API key for Google Gemini model | Yes (Backend) |
| `REDIS_URL` | Redis connection string for Celery | Yes (Backend) |
| `EXPO_PUBLIC_API_URL`| Backend URL for the Mobile app | Yes (Mobile) |

*For detailed configuration, refer to the specific module documentation.*

## 📚 Documentation

The project is structured into three main modules:

- [Backend & AI Engine](./backend/README.md) — The Gemma 4 inference pipeline, Computer Vision, and audio analysis.
- [Frontend Web App](./frontend/README.md) — The responsive web interface for families and professionals.
- [Mobile Application](./mobile/README.md) — The React Native app for on-the-go screening.

## 📜 License

This Writeup has been released under the Attribution 4.0 International (CC BY 4.0) license.
