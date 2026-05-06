# Mobile App Fine-Tuning Plan

> [!IMPORTANT]
> **Socratic Gate: User Review Required**
> Before we proceed to execution, please answer the following questions to clarify the requirements:
> 
> 1. **Google Login:** If the user declines or cancels the Google Login when clicking "Save Report", should we abort the save operation, or allow them to save locally/anonymously?
> 2. **Video Resolution:** To reduce the video weight, should we set the camera recording quality to `480p` or `720p`? (480p is much smaller but lower quality, whereas 720p is a good middle ground).
> 3. **Timer:** When the timer reaches the suggested 30 seconds, should the recording automatically stop, or should it just visually warn the user?
> 4. **Login State:** Should we check if the user is already logged in before prompting, and only prompt if they are not?

## Overview

We are fine-tuning the mobile application to improve the user experience during the triagem (screening) process. This involves fixing camera initialization issues, adding a timer to guide video length, reducing video payload size for better AI inference performance, increasing readability on the results page, and enforcing Google authentication when saving reports.

- **Project Type:** MOBILE
- **Primary Agent:** `mobile-developer`

## Success Criteria

- User is prompted for Google Login when saving a report in `resultado.tsx`.
- The `CameraView` in `triagem.tsx` opens without a black screen and its preview size is increased.
- A recording timer is displayed during video capture, indicating elapsed time and suggesting a 30s limit.
- Video resolution is reduced (e.g., via `videoQuality` prop) to minimize payload size.
- Font size on the results page (`resultado.tsx`) is increased by 10%.

## Tech Stack

- **React Native (Expo)**
- **expo-camera**
- **@react-native-google-signin/google-signin**
- **Tailwind CSS (NativeWind)**

## File Structure

Files to be modified:
- `mobile/app/triagem.tsx` (Camera fix, Timer, Resolution reduction)
- `mobile/app/resultado.tsx` (Google login integration, Font size increase)

## Task Breakdown

### Task 1: Fix Camera Initialization and Enlarge Preview
- **Agent:** `mobile-developer`
- **Skills:** `mobile-design`
- **Input:** `CameraView` layout in `mobile/app/triagem.tsx`.
- **Output:** Add `useFocusEffect` or a small timeout to force a refresh when the camera screen is opened to prevent the black screen. Adjust Tailwind classes (e.g., changing aspect ratio or container height) to increase the camera preview size.
- **Verify:** Camera opens correctly on the first attempt without needing to go back and forth. Preview occupies more screen space.

### Task 2: Implement Recording Timer
- **Agent:** `mobile-developer`
- **Skills:** `mobile-design`, `clean-code`
- **Input:** Video recording state logic in `mobile/app/triagem.tsx`.
- **Output:** Add a `setInterval` timer when `isRecording` becomes true. Display the elapsed time on the screen with a label suggesting "Máximo de 30s". Implement auto-stop if requested in the Socratic Gate.
- **Verify:** Timer accurately reflects recording duration and is clearly visible.

### Task 3: Reduce Video Resolution
- **Agent:** `mobile-developer`
- **Skills:** `performance-profiling`
- **Input:** `CameraView` `recordAsync` options in `mobile/app/triagem.tsx`.
- **Output:** Modify `recordAsync` or `CameraView` props to set `videoQuality` (e.g., `'720p'` or `'480p'`) to decrease the recorded file size.
- **Verify:** The output video is noticeably smaller in size, improving upload speed to the AI model.

### Task 4: Integrate Google Login on Save Report
- **Agent:** `mobile-developer`
- **Skills:** `mobile-design`, `clean-code`
- **Input:** Save button logic in `mobile/app/resultado.tsx`.
- **Output:** Import `@react-native-google-signin/google-signin`. Intercept the save action, check for existing login, and trigger `GoogleSignin.signIn()` if the user is not authenticated before proceeding with the save.
- **Verify:** Clicking save triggers the Google auth flow.

### Task 5: Increase Font Size on Results Page
- **Agent:** `mobile-developer`
- **Skills:** `mobile-design`
- **Input:** UI text components in `mobile/app/resultado.tsx`.
- **Output:** Adjust Tailwind text classes (e.g., `text-base` to `text-lg`, or similar ~10% increase) for the results summary text.
- **Verify:** Text is larger and readable without causing layout issues.

## Phase X: Verification Checklist

- [ ] Lint & Type Check: `npm run lint` & `npx tsc --noEmit`
- [ ] No purple/violet hex codes used.
- [ ] Socratic Gate was respected and user answered.
- [ ] Manual test of video recording flow.
- [ ] Google Login triggers on save report.
- [ ] Font size looks correct on the Results page.
