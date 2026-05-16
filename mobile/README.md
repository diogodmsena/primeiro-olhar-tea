# Mobile App - Primeiro Olhar 📱

The "Primeiro Olhar Mobile" is a React Native (Expo) application serving as the mobile frontier for families and caregivers to submit screening videos and questionnaires focusing on behavioral and neurodivergence (ASD) signs. The app processes uploads and seamlessly forwards them to our AI-powered Backend (Google Gemini Flash Multimodal).

## Quick Start

To run the app on an emulator or physical device:

```bash
# 1. Navigate to the mobile directory
cd mobile

# 2. Install dependencies (ensuring exact versions to avoid UI breaks)
npm install

# 3. Start the Expo bundler
npx expo start -c
```
*Note: Scan the generated QR code with the Expo Go app (Android) or your native Camera (iOS) to launch the app.*

## Features

- **Native File Handling**: Securely captures and uploads videos using `expo-camera` without aggressive compression that could harm AI analysis.
- **Rich Result Display**: Parses and renders markdown (including bolding and structures injected by Gemini) using `react-native-markdown-display`.
- **Dynamic Theming**: Utilizes NativeWind (Tailwind CSS Mobile) for responsive, highly adaptable native styling.
- **Cross-Device Compatibility**: File-based routing via Expo Router ensures robust navigation patterns on both iOS and Android.

## Configuration

You must bridge the network gap between your physical device/emulator and the local backend server. 

Create a `.env` file in the `mobile/` directory:

| Variable | Description | Required |
|----------|-------------|----------|
| `EXPO_PUBLIC_API_URL` | Local network IP pointing to the Backend | Yes |

> [!WARNING]
> Android Studio emulators typically use `10.0.2.2` to resolve localhost. However, physical devices using Expo Go via Wi-Fi **require** your machine's explicit IPv4 address (e.g., `http://192.168.x.x:8000`).

## Architecture Overview

```text
/mobile
  ├── app/                  # Expo Router core
  │    ├── _layout.tsx      # App wrappers (Auth, i18n, SafeArea)
  │    ├── index.tsx        # Splash Screen
  │    ├── triagem.tsx      # Multi-step screening form
  │    ├── resultado.tsx    # Radar charts and Gemini report parser
  │    └── historico.tsx    # Native FlatList for historical reports
  ├── components/           # Global injectable components
  ├── contexts/             # Singleton Memory Layer (UI States)
  └── global.css            # Tailwind key injection for Native CSS
```

## License

MIT
