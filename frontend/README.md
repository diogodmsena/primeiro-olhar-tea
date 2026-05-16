# Frontend Web — Primeiro Olhar 🌐

The responsive Web Application for the "Primeiro Olhar" platform, built with Next.js and Tailwind CSS.

## Role in the Mission

This is the **face** of Primeiro Olhar — the interface that a worried parent sees when they take their first step. Every design decision here was made with one question in mind: *"Will this make a family feel safe enough to continue?"*. The UI avoids alarming colors, clinical jargon, and sensory overload. Instead, it uses warm illustrations, gentle animations, and clear language to guide caregivers through the screening process. From uploading a simple 30-second video to reading the AI-generated report, the experience is designed to be **welcoming, non-judgmental, and empowering**.

---

## Quick Start

To run the frontend development server:

```bash
# 1. Navigate to the frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Features

- **Progressive Upload Flow**: A step-by-step wizard for parents to upload videos and answer behavioral questions securely.
- **Dynamic Radar Charts**: Uses `recharts` to visually map the child's multimodal profile (Prosody, Expressivity, Eye Contact).
- **Internationalization (i18n)**: Full support for English, Portuguese, and Spanish without relying on external routing libraries.
- **PDF Generation**: Exports the AI-generated clinical report to a clean, professional PDF layout.
- **Responsive Design**: Built Mobile-first using Tailwind CSS for perfect rendering across all screen sizes.

## Configuration

Create a `.env.local` file in the `frontend/` directory:

| Variable | Description | Default |
|----------|-------------|---------|
| `API_URL` | The URL of the Python Backend API | `http://localhost:8000` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | OAuth Client ID for Auth | `None` |

## Documentation

- **State Management**: Uses React Context (`AuthContext`, `I18nContext`) for lightweight global state.
- **Styling**: Tailwind CSS is configured with custom color palettes aimed at neurodivergent accessibility (avoiding highly saturated colors like pure red or neon purple).

## License

This Writeup has been released under the Attribution 4.0 International (CC BY 4.0) license.
