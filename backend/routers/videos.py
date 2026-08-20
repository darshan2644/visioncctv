"""
Video upload, list, and management router.
Phase 2: Easiest feature — file I/O only, no AI.
"""

import json
import time
import uuid
import shutil
from pathlib import Path
from typing import List

import cv2
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import JSONResponse

router = APIRouter()

BASE_DIR = Path(__file__).parent.parent
UPLOADS_DIR = BASE_DIR / "storage" / "uploads"
THUMBNAILS_DIR = BASE_DIR / "storage" / "thumbnails"

ALLOWED_EXTENSIONS = {".mp4", ".avi", ".mov", ".mkv", ".wmv"}


def _extract_thumbnail(video_path: Path, thumb_path: Path) -> float | None:
    """Extract first frame as JPEG thumbnail and return video duration."""
    cap = cv2.VideoCapture(str(video_path))
    duration = None
    try:
        fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = cap.get(cv2.CAP_PROP_FRAME_COUNT)
        if fps and fps > 0:
            duration = total_frames / fps

        success, frame = cap.read()
        if success:
            cv2.imwrite(str(thumb_path), frame)
    finally:
        cap.release()
    return duration


@router.post("/upload")
async def upload_video(
    file: UploadFile = File(...),
    camera_id: str = Form(default="CAM-01"),
):
    """Upload a CCTV video file. Returns video ID and metadata."""
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    video_id = str(uuid.uuid4())[:8]
    safe_name = f"{video_id}{ext}"
    video_path = UPLOADS_DIR / safe_name
    thumb_path = THUMBNAILS_DIR / f"{video_id}.jpg"

    # Save file
    with open(video_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    # Extract thumbnail + duration
    duration = _extract_thumbnail(video_path, thumb_path)

    meta = {
        "id": video_id,
        "original_filename": file.filename,
        "stored_filename": safe_name,
        "camera_id": camera_id,
        "upload_time": time.time(),
        "size_bytes": video_path.stat().st_size,
        "duration_seconds": duration,
        "thumbnail_url": f"/storage/thumbnails/{video_id}.jpg" if thumb_path.exists() else None,
    }
    (UPLOADS_DIR / f"{video_id}.meta.json").write_text(json.dumps(meta, indent=2))

    return JSONResponse(status_code=201, content={"success": True, "video": meta})


@router.get("/list")
def list_videos():
    """List all uploaded videos with metadata."""
    videos = []
    for meta_file in sorted(UPLOADS_DIR.glob("*.meta.json")):
        try:
            meta = json.loads(meta_file.read_text())
            videos.append(meta)
        except Exception:
            continue
    return {"videos": videos, "count": len(videos)}


@router.delete("/{video_id}")
def delete_video(video_id: str):
    """Delete an uploaded video and its metadata."""
    meta_file = UPLOADS_DIR / f"{video_id}.meta.json"
    if not meta_file.exists():
        raise HTTPException(status_code=404, detail="Video not found")

    meta = json.loads(meta_file.read_text())
    video_path = UPLOADS_DIR / meta["stored_filename"]

    if video_path.exists():
        video_path.unlink()
    meta_file.unlink()

    # Remove thumbnail
    thumb = THUMBNAILS_DIR / f"{video_id}.jpg"
    if thumb.exists():
        thumb.unlink()

    return {"success": True, "deleted_id": video_id}


@router.get("/{video_id}")
def get_video(video_id: str):
    """Get metadata for a specific video."""
    meta_file = UPLOADS_DIR / f"{video_id}.meta.json"
    if not meta_file.exists():
        raise HTTPException(status_code=404, detail="Video not found")
    return json.loads(meta_file.read_text())
