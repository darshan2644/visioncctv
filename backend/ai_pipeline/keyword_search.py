"""
Keyword search pipeline.
Uses CLIP when torch is available; falls back to OpenCV-based
color/object similarity matching (demo mode) when torch DLLs are blocked.
"""

import json
import time
import uuid
from pathlib import Path
from typing import Any

import cv2
import numpy as np

BASE_DIR = Path(__file__).parent.parent
RESULTS_DIR = BASE_DIR / "storage" / "results"

_TORCH_AVAILABLE = False
_clip_model = None
_clip_processor = None

try:
    import torch
    _TORCH_AVAILABLE = True
    print("[keyword_search] PyTorch available ✓")
except Exception as e:
    print(f"[keyword_search] PyTorch unavailable ({e}). Using fallback demo mode.")


def _get_clip():
    global _clip_model, _clip_processor
    if _clip_model is None:
        from transformers import CLIPModel, CLIPProcessor  # noqa: PLC0415
        print("[CLIP] Loading model…")
        _clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
        _clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
        _clip_model.eval()
        print("[CLIP] Model loaded.")
    return _clip_model, _clip_processor


def _keyword_to_color_hsv(keyword: str) -> tuple[np.ndarray, np.ndarray] | None:
    """Rough mapping from color keywords to HSV range for demo mode."""
    kw = keyword.lower()
    color_map = {
        "red":    ([0, 50, 50], [20, 255, 255]),
        "blue":   ([100, 50, 50], [140, 255, 255]),
        "green":  ([40, 50, 50], [80, 255, 255]),
        "white":  ([0, 0, 180], [180, 30, 255]),
        "black":  ([0, 0, 0], [180, 255, 40]),
        "yellow": ([20, 100, 100], [40, 255, 255]),
        "orange": ([10, 100, 100], [25, 255, 255]),
    }
    for color, (lo, hi) in color_map.items():
        if color in kw:
            return np.array(lo), np.array(hi)
    return None


def _demo_keyword_search(
    video_path: Path,
    keyword: str,
    camera_id: str,
    similarity_threshold: float,
    job_id: str,
) -> list[dict[str, Any]]:
    """
    Demo keyword search using:
    1. Motion detection (high-motion frames are more "interesting")
    2. Color matching if a color is mentioned in the keyword
    Falls back gracefully when torch/CLIP is not available.
    """
    from ai_pipeline.frame_extractor import save_frame, extract_clip, format_timestamp  # noqa: PLC0415

    job_dir = RESULTS_DIR / job_id
    job_dir.mkdir(parents=True, exist_ok=True)

    color_range = _keyword_to_color_hsv(keyword)
    matches = []

    cap = cv2.VideoCapture(str(video_path))
    video_fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
    frame_interval = max(1, int(video_fps))  # 1 fps
    frame_idx = 0
    prev_gray = None

    try:
        while cap.isOpened():
            success, frame = cap.read()
            if not success:
                break
            if frame_idx % frame_interval != 0:
                frame_idx += 1
                continue

            timestamp = frame_idx / video_fps
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

            score = 0.0

            # Motion score
            if prev_gray is not None:
                diff = cv2.absdiff(prev_gray, gray)
                motion = diff.mean() / 255.0
                score = max(score, min(1.0, motion * 5))

            # Color score
            if color_range is not None:
                hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
                lo, hi = color_range
                mask = cv2.inRange(hsv, lo, hi)
                color_ratio = mask.mean() / 255.0
                score = max(score, min(1.0, color_ratio * 10))

            prev_gray = gray

            if score < similarity_threshold:
                frame_idx += 1
                continue

            frame_filename = f"kw_{job_id}_{frame_idx:06d}.jpg"
            frame_path = job_dir / frame_filename
            save_frame(frame, frame_path)

            clip_filename = f"clip_{job_id}_{frame_idx:06d}.mp4"
            clip_path = job_dir / clip_filename
            extract_clip(video_path, clip_path, timestamp, window_seconds=5.0)

            matches.append({
                "camera_id": camera_id,
                "timestamp": timestamp,
                "timestamp_str": format_timestamp(timestamp),
                "frame_url": f"/storage/results/{job_id}/{frame_filename}",
                "clip_url": f"/storage/results/{job_id}/{clip_filename}",
                "confidence": round(score, 4),
                "label": keyword,
                "search_type": "keyword",
            })

            frame_idx += 1
    finally:
        cap.release()

    return matches


def run_keyword_search(
    video_path,
    keyword: str,
    camera_id: str = "CAM-01",
    similarity_threshold: float = 0.25,
    sample_fps: float = 1.0,
    job_id: str | None = None,
) -> list[dict[str, Any]]:
    """
    Search video for frames matching a keyword.
    Uses CLIP when torch is available; falls back to motion+color demo mode.
    """
    if job_id is None:
        job_id = str(uuid.uuid4())[:8]

    job_dir = RESULTS_DIR / job_id
    job_dir.mkdir(parents=True, exist_ok=True)
    video_path = Path(video_path)

    if not _TORCH_AVAILABLE:
        print("[keyword_search] Running in DEMO mode (motion + color detection)")
        matches = _demo_keyword_search(video_path, keyword, camera_id, similarity_threshold, job_id)
    else:
        from ai_pipeline.frame_extractor import save_frame, extract_clip, format_timestamp  # noqa: PLC0415
        from PIL import Image  # noqa: PLC0415
        import torch  # noqa: PLC0415

        model, processor = _get_clip()
        matches = []

        cap = cv2.VideoCapture(str(video_path))
        video_fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
        frame_interval = max(1, int(video_fps / sample_fps))
        frame_idx = 0

        try:
            while cap.isOpened():
                success, frame = cap.read()
                if not success:
                    break
                if frame_idx % frame_interval != 0:
                    frame_idx += 1
                    continue

                timestamp = frame_idx / video_fps
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                pil_image = Image.fromarray(frame_rgb)

                with torch.no_grad():
                    inputs = processor(text=[keyword], images=pil_image, return_tensors="pt", padding=True)
                    outputs = model(**inputs)
                    probs = outputs.logits_per_image.softmax(dim=1)
                    similarity = float(probs[0][0].item())

                if similarity < similarity_threshold:
                    frame_idx += 1
                    continue

                frame_filename = f"kw_{job_id}_{frame_idx:06d}.jpg"
                frame_path = job_dir / frame_filename
                save_frame(frame, frame_path)

                clip_filename = f"clip_{job_id}_{frame_idx:06d}.mp4"
                clip_path = job_dir / clip_filename
                extract_clip(video_path, clip_path, timestamp, window_seconds=5.0)

                matches.append({
                    "camera_id": camera_id,
                    "timestamp": timestamp,
                    "timestamp_str": format_timestamp(timestamp),
                    "frame_url": f"/storage/results/{job_id}/{frame_filename}",
                    "clip_url": f"/storage/results/{job_id}/{clip_filename}",
                    "confidence": round(similarity, 4),
                    "label": keyword,
                    "search_type": "keyword",
                })

                frame_idx += 1
        finally:
            cap.release()

    manifest = {
        "job_id": job_id,
        "video": str(video_path.name),
        "camera_id": camera_id,
        "keyword": keyword,
        "search_type": "keyword",
        "torch_available": _TORCH_AVAILABLE,
        "created_at": time.time(),
        "match_count": len(matches),
        "matches": matches,
    }
    (job_dir / "manifest.json").write_text(json.dumps(manifest, indent=2))
    return matches
