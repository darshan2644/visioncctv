"""
VisionCCTV Backend — FastAPI Application
AI-Powered CCTV Analysis Tool
"""

import os
import sys
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Ensure storage dirs exist at startup
BASE_DIR = Path(__file__).parent
STORAGE_DIR = BASE_DIR / "storage"
UPLOADS_DIR = STORAGE_DIR / "uploads"
REFERENCES_DIR = STORAGE_DIR / "references"
RESULTS_DIR = STORAGE_DIR / "results"
THUMBNAILS_DIR = STORAGE_DIR / "thumbnails"

for d in [UPLOADS_DIR, REFERENCES_DIR, RESULTS_DIR, THUMBNAILS_DIR]:
    d.mkdir(parents=True, exist_ok=True)

# Seed demo database from the original repo if empty
ORIGINAL_DB = BASE_DIR.parent / "YOLOSystem" / "database"
if not ORIGINAL_DB.exists():
    ORIGINAL_DB = BASE_DIR.parent / "Face-Detection-and-Recognition-with-YOLOv8-and-FaceNet-PyTorch-main" / "database"

if ORIGINAL_DB.exists():
    import shutil, json as _json, time as _time  # noqa: E401
    for img in ORIGINAL_DB.glob("*.jpg"):
        dest = REFERENCES_DIR / img.name
        if not dest.exists():
            shutil.copy2(img, dest)
        # Create meta.json if missing
        stem = img.stem
        meta_f = REFERENCES_DIR / f"{stem}.meta.json"
        if not meta_f.exists():
            meta_f.write_text(_json.dumps({
                "id": stem,
                "original_filename": img.name,
                "stored_filename": img.name,
                "label": stem.replace("_", " ").title(),
                "upload_time": _time.time(),
                "image_url": f"/storage/references/{img.name}",
            }, indent=2))

# Seed demo video if uploads empty
ORIGINAL_VIDEO = BASE_DIR.parent / "YOLOSystem" / "subway.mp4"
if not ORIGINAL_VIDEO.exists():
    ORIGINAL_VIDEO = BASE_DIR.parent / "Face-Detection-and-Recognition-with-YOLOv8-and-FaceNet-PyTorch-main" / "subway.mp4"

if ORIGINAL_VIDEO.exists() and not any(UPLOADS_DIR.glob("*.meta.json")):
    import shutil, json, time
    shutil.copy2(ORIGINAL_VIDEO, UPLOADS_DIR / "subway.mp4")
    meta = {
        "id": "subway",
        "original_filename": "subway.mp4",
        "stored_filename": "subway.mp4",
        "camera_id": "CAM-DEMO-01",
        "upload_time": time.time(),
        "size_bytes": ORIGINAL_VIDEO.stat().st_size,
        "duration_seconds": None,
        "thumbnail_url": None,
    }
    (UPLOADS_DIR / "subway.meta.json").write_text(json.dumps(meta, indent=2))

# Register routers
from routers import videos, search, export, references  # noqa: E402

app = FastAPI(
    title="VisionCCTV API",
    description="AI-powered CCTV analysis: face re-identification and keyword search",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve stored images/frames statically
app.mount("/storage", StaticFiles(directory=str(STORAGE_DIR)), name="storage")

app.include_router(videos.router, prefix="/api/videos", tags=["Videos"])
app.include_router(references.router, prefix="/api/references", tags=["References"])
app.include_router(search.router, prefix="/api/search", tags=["Search"])
app.include_router(export.router, prefix="/api/export", tags=["Export"])


@app.get("/health", tags=["Health"])
def health():
    """Health check endpoint."""
    return {"status": "ok", "service": "VisionCCTV API"}


@app.get("/", tags=["Health"])
def root():
    return {"message": "VisionCCTV API is running. Visit /docs for API documentation."}
