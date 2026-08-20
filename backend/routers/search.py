"""
Search router — triggers face recognition and keyword search pipelines.
"""

import json
import uuid
from pathlib import Path
from typing import Any

from fastapi import APIRouter, BackgroundTasks, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

router = APIRouter()

BASE_DIR = Path(__file__).parent.parent
UPLOADS_DIR = BASE_DIR / "storage" / "uploads"
REFERENCES_DIR = BASE_DIR / "storage" / "references"
RESULTS_DIR = BASE_DIR / "storage" / "results"

# In-memory job tracker (resets on server restart; fine for hackathon)
_jobs: dict[str, dict[str, Any]] = {}


class ImageSearchRequest(BaseModel):
    video_ids: list[str] = Field(..., description="List of uploaded video IDs to search")
    reference_ids: list[str] = Field(..., description="List of reference image IDs")
    confidence_threshold: float = Field(0.65, ge=0.0, le=1.0)
    similarity_threshold: float = Field(0.70, ge=0.0, le=1.0)
    sample_fps: float = Field(1.0, ge=0.1, le=10.0)


class KeywordSearchRequest(BaseModel):
    video_ids: list[str] = Field(..., description="List of uploaded video IDs to search")
    keyword: str = Field(..., min_length=1, description="Natural-language search query")
    similarity_threshold: float = Field(0.25, ge=0.0, le=1.0)
    sample_fps: float = Field(1.0, ge=0.1, le=10.0)


def _resolve_video(video_id: str) -> tuple[Path, dict]:
    meta_file = UPLOADS_DIR / f"{video_id}.meta.json"
    if not meta_file.exists():
        raise HTTPException(status_code=404, detail=f"Video '{video_id}' not found")
    meta = json.loads(meta_file.read_text())
    video_path = UPLOADS_DIR / meta["stored_filename"]
    if not video_path.exists():
        raise HTTPException(status_code=404, detail=f"Video file for '{video_id}' missing from disk")
    return video_path, meta


def _resolve_reference(ref_id: str) -> Path:
    meta_file = REFERENCES_DIR / f"{ref_id}.meta.json"
    if not meta_file.exists():
        raise HTTPException(status_code=404, detail=f"Reference '{ref_id}' not found")
    meta = json.loads(meta_file.read_text())
    ref_path = REFERENCES_DIR / meta["stored_filename"]
    if not ref_path.exists():
        raise HTTPException(status_code=404, detail=f"Reference file for '{ref_id}' missing")
    return ref_path


def _run_face_search_task(job_id: str, request: ImageSearchRequest):
    """Background task for face recognition search."""
    from ai_pipeline.face_recognition import run_face_recognition_search  # noqa: PLC0415

    _jobs[job_id]["status"] = "running"
    all_matches = []

    try:
        ref_paths = [_resolve_reference(rid) for rid in request.reference_ids]

        for vid_id in request.video_ids:
            video_path, meta = _resolve_video(vid_id)
            sub_job_id = f"{job_id}_{vid_id}"
            matches = run_face_recognition_search(
                video_path=video_path,
                reference_image_paths=ref_paths,
                camera_id=meta.get("camera_id", "CAM-01"),
                confidence_threshold=request.confidence_threshold,
                similarity_threshold=request.similarity_threshold,
                sample_fps=request.sample_fps,
                job_id=sub_job_id,
            )
            all_matches.extend(matches)

        _jobs[job_id]["status"] = "completed"
        _jobs[job_id]["matches"] = all_matches
        _jobs[job_id]["match_count"] = len(all_matches)
    except Exception as e:
        _jobs[job_id]["status"] = "failed"
        _jobs[job_id]["error"] = str(e)


def _run_keyword_search_task(job_id: str, request: KeywordSearchRequest):
    """Background task for keyword search."""
    from ai_pipeline.keyword_search import run_keyword_search  # noqa: PLC0415

    _jobs[job_id]["status"] = "running"
    all_matches = []

    try:
        for vid_id in request.video_ids:
            video_path, meta = _resolve_video(vid_id)
            sub_job_id = f"{job_id}_{vid_id}"
            matches = run_keyword_search(
                video_path=video_path,
                keyword=request.keyword,
                camera_id=meta.get("camera_id", "CAM-01"),
                similarity_threshold=request.similarity_threshold,
                sample_fps=request.sample_fps,
                job_id=sub_job_id,
            )
            all_matches.extend(matches)

        _jobs[job_id]["status"] = "completed"
        _jobs[job_id]["matches"] = all_matches
        _jobs[job_id]["match_count"] = len(all_matches)
    except Exception as e:
        _jobs[job_id]["status"] = "failed"
        _jobs[job_id]["error"] = str(e)


@router.post("/by-image")
def search_by_image(request: ImageSearchRequest, background_tasks: BackgroundTasks):
    """Start a face recognition search job. Returns a job_id to poll for status."""
    job_id = str(uuid.uuid4())[:8]
    _jobs[job_id] = {"status": "queued", "type": "face_recognition", "matches": [], "match_count": 0}
    background_tasks.add_task(_run_face_search_task, job_id, request)
    return {"job_id": job_id, "status": "queued"}


@router.post("/by-keyword")
def search_by_keyword(request: KeywordSearchRequest, background_tasks: BackgroundTasks):
    """Start a keyword search job. Returns a job_id to poll for status."""
    job_id = str(uuid.uuid4())[:8]
    _jobs[job_id] = {"status": "queued", "type": "keyword", "matches": [], "match_count": 0}
    background_tasks.add_task(_run_keyword_search_task, job_id, request)
    return {"job_id": job_id, "status": "queued"}


@router.get("/job/{job_id}")
def get_job_status(job_id: str):
    """Poll job status and retrieve results when complete."""
    if job_id not in _jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    return _jobs[job_id]


@router.get("/jobs")
def list_jobs():
    """List all search jobs in this session."""
    return {"jobs": {k: {kk: vv for kk, vv in v.items() if kk != "matches"} for k, v in _jobs.items()}}
