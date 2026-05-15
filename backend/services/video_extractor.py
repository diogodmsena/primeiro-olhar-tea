"""
services/video_extractor.py

CPU-efficient behavioral video analysis for autism screening.
Uses MediaPipe Face Mesh to extract eye contact and head pose metrics
from short video clips (10-15s) without exhausting RAM.
"""

from __future__ import annotations

import logging
import math
from typing import Optional

import cv2
import mediapipe as mp
import numpy as np

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# MediaPipe landmark index constants
# ---------------------------------------------------------------------------

LEFT_EYE_INDICES: list[int] = [33, 160, 158, 133, 153, 144]
RIGHT_EYE_INDICES: list[int] = [362, 385, 387, 263, 373, 380]

# Iris centre indices (only available when refine_landmarks=True)
LEFT_IRIS_CENTER: int = 468
RIGHT_IRIS_CENTER: int = 473

# Canonical 3D face model for solvePnP (nose, chin, eye corners, mouth corners)
FACE_3D_MODEL: np.ndarray = np.array(
    [
        [0.0, 0.0, 0.0],
        [0.0, -330.0, -65.0],
        [-225.0, 170.0, -135.0],
        [225.0, 170.0, -135.0],
        [-150.0, -150.0, -125.0],
        [150.0, -150.0, -125.0],
    ],
    dtype=np.float64,
)

POSE_LANDMARK_INDICES: list[int] = [1, 152, 263, 33, 287, 57]

EYE_CONTACT_THRESHOLD: float = 0.6
HEAD_MOVEMENT_LOW_VAR: float = 50.0
HEAD_MOVEMENT_HIGH_VAR: float = 300.0


class BehavioralVideoAnalyzer:
    """
    Analyses short behavioural videos to extract clinical metrics used in
    autism-spectrum screening.

    CPU-friendly: subsamples to ~target_fps frames/second and runs
    MediaPipe Face Mesh in non-GPU mode.
    """

    def __init__(self) -> None:
        if not hasattr(mp, 'solutions'):
            import mediapipe.solutions.face_mesh
            
        self._face_mesh = mp.solutions.face_mesh.FaceMesh(
            static_image_mode=False,
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5,
        )
        logger.info("BehavioralVideoAnalyzer initialised (MediaPipe Face Mesh, refine_landmarks=True)")

    # ------------------------------------------------------------------
    # Part 1 — Frame extraction with frame-skip
    # ------------------------------------------------------------------

    def _extract_frames(self, video_path: str, target_fps: float = 3.0) -> list[np.ndarray]:
        """
        Open *video_path* and return frames sampled at *target_fps* fps.
        Optimized: uses cap.set to jump frames and resizes to 480p for faster MediaPipe.
        """
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError(f"OpenCV could not open video: {video_path}")

        source_fps: float = cap.get(cv2.CAP_PROP_FPS) or 30.0
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration = total_frames / source_fps if source_fps > 0 else 0
        
        # Calculate exactly which frame indices we want
        num_frames_to_extract = max(1, int(duration * target_fps))
        frame_indices = [int(i * (source_fps / target_fps)) for i in range(num_frames_to_extract)]
        # Ensure we don't go out of bounds
        frame_indices = [idx for idx in frame_indices if idx < total_frames]

        frames: list[np.ndarray] = []
        
        for idx in frame_indices:
            cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
            ret, frame = cap.read()
            if not ret:
                break
            
            # Optimization: Resize frame to 480p (height=480, maintain aspect ratio)
            # MediaPipe Face Mesh works perfectly at this resolution and it's much faster.
            h, w = frame.shape[:2]
            if h > 480:
                scale = 480 / h
                new_w = int(w * scale)
                frame = cv2.resize(frame, (new_w, 480), interpolation=cv2.INTER_AREA)
            
            frames.append(frame)

        cap.release()
        logger.info(
            "Extracted %d frames from '%s' (duration %.1fs, jump-seeking enabled, resized to 480p)",
            len(frames), video_path, duration
        )
        return frames

    # ------------------------------------------------------------------
    # Part 2 — Heuristic calculations on MediaPipe landmarks
    # ------------------------------------------------------------------

    def _calculate_eye_contact(
        self, face_landmarks, frame_w: int, frame_h: int
    ) -> float:
        """
        Estimate gaze score [0.0, 1.0] based on iris position relative
        to the eye bounding box. 1.0 = looking directly at the camera.
        """
        def _iris_offset(eye_indices: list[int], iris_index: int) -> float:
            lm = face_landmarks.landmark
            xs = [lm[i].x * frame_w for i in eye_indices]
            ys = [lm[i].y * frame_h for i in eye_indices]
            eye_cx = (min(xs) + max(xs)) / 2
            eye_cy = (min(ys) + max(ys)) / 2
            eye_half_w = (max(xs) - min(xs)) / 2 + 1e-6

            iris_x = lm[iris_index].x * frame_w
            iris_y = lm[iris_index].y * frame_h

            dx = abs(iris_x - eye_cx) / eye_half_w
            dy = abs(iris_y - eye_cy) / eye_half_w

            offset = math.hypot(dx, dy)
            return max(0.0, 1.0 - min(offset, 1.0))

        try:
            left_score = _iris_offset(LEFT_EYE_INDICES, LEFT_IRIS_CENTER)
            right_score = _iris_offset(RIGHT_EYE_INDICES, RIGHT_IRIS_CENTER)
            return (left_score + right_score) / 2.0
        except (IndexError, AttributeError):
            return 0.0

    def _estimate_head_pose(
        self, face_landmarks, frame_w: int, frame_h: int
    ) -> tuple[float, float, float]:
        """
        Estimate head Euler angles (pitch, yaw, roll) via cv2.solvePnP.
        Returns (0.0, 0.0, 0.0) on any numerical failure.
        """
        try:
            lm = face_landmarks.landmark
            image_points = np.array(
                [[lm[i].x * frame_w, lm[i].y * frame_h] for i in POSE_LANDMARK_INDICES],
                dtype=np.float64,
            )

            focal_length = frame_w
            camera_matrix = np.array(
                [
                    [focal_length, 0, frame_w / 2],
                    [0, focal_length, frame_h / 2],
                    [0, 0, 1],
                ],
                dtype=np.float64,
            )
            dist_coeffs = np.zeros((4, 1), dtype=np.float64)

            success, rotation_vec, _ = cv2.solvePnP(
                FACE_3D_MODEL, image_points, camera_matrix, dist_coeffs,
                flags=cv2.SOLVEPNP_ITERATIVE,
            )
            if not success:
                return 0.0, 0.0, 0.0

            rotation_mat, _ = cv2.Rodrigues(rotation_vec)
            pose_mat = cv2.hconcat([rotation_mat, np.zeros((3, 1))])
            _, _, _, _, _, _, euler_angles = cv2.decomposeProjectionMatrix(pose_mat)

            return float(euler_angles[0]), float(euler_angles[1]), float(euler_angles[2])

        except (cv2.error, Exception) as exc:
            logger.debug("solvePnP failed for frame: %s", exc)
            return 0.0, 0.0, 0.0

    # ------------------------------------------------------------------
    # Part 3 — Orchestration and aggregation
    # ------------------------------------------------------------------

    def analyze_video(self, video_path: str) -> dict:
        """
        Run the full analysis pipeline and return a dict matching
        the VideoFeatureOutput Pydantic model:

            {
                "avg_gaze_score":        float,
                "eye_contact_ratio":     float,
                "head_movement_pattern": str,   # "baixo" | "normal" | "intenso"
                "facial_expressivity":   str,
            }

        Returns safe defaults on corrupt files or videos with no detected face.
        """
        safe_defaults: dict = {
            "avg_gaze_score": 0.0,
            "eye_contact_ratio": 0.0,
            "head_movement_pattern": "normal",
            "facial_expressivity": "normal",
        }

        try:
            frames = self._extract_frames(video_path, target_fps=3.0)
        except ValueError as exc:
            logger.error("Frame extraction failed: %s", exc)
            return safe_defaults

        if not frames:
            logger.warning("No frames extracted from '%s'", video_path)
            return safe_defaults

        gaze_scores: list[float] = []
        yaw_angles: list[float] = []

        for frame in frames:
            frame_h, frame_w = frame.shape[:2]
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = self._face_mesh.process(rgb_frame)

            if not results.multi_face_landmarks:
                continue

            face_lm = results.multi_face_landmarks[0]
            gaze_scores.append(self._calculate_eye_contact(face_lm, frame_w, frame_h))
            _, yaw, _ = self._estimate_head_pose(face_lm, frame_w, frame_h)
            yaw_angles.append(yaw)

        if not gaze_scores:
            logger.warning("No faces detected in any frame of '%s'.", video_path)
            return safe_defaults

        avg_gaze_score: float = float(np.mean(gaze_scores))
        engaged_frames = sum(1 for s in gaze_scores if s > EYE_CONTACT_THRESHOLD)
        eye_contact_ratio: float = engaged_frames / len(gaze_scores)

        head_movement_pattern: str = "normal"
        if yaw_angles:
            yaw_variance = float(np.var(yaw_angles))
            if yaw_variance < HEAD_MOVEMENT_LOW_VAR:
                head_movement_pattern = "baixo"
            elif yaw_variance > HEAD_MOVEMENT_HIGH_VAR:
                head_movement_pattern = "intenso"

        logger.info(
            "CV complete — avg_gaze=%.3f, eye_ratio=%.3f, head=%s (%d faces / %d frames)",
            avg_gaze_score, eye_contact_ratio, head_movement_pattern,
            len(gaze_scores), len(frames),
        )

        return {
            "avg_gaze_score":        round(avg_gaze_score, 4),
            "eye_contact_ratio":     round(eye_contact_ratio, 4),
            "head_movement_pattern": head_movement_pattern,
            "facial_expressivity":   "normal",
        }
