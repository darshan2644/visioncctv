"""
Reference image upload and listing router.
Phase 3: Upload suspect/vehicle photos for face re-ID.
"""

import json
import shutil
import time
import uuid
from pathlib import Path

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import JSONResponse

router = APIRouter()

BASE_DIR = Path(__file__).parent.parent
REFERENCES_DIR = BASE_DIR / "storage" / "references"

ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp", ".jfif", ".avif", ".gif", ".tiff", ".svg"}


@router.post("/upload")
async def upload_reference(
    file: UploadFile = File(...),
    label: str = Form(default="Unknown"),
):
    """Upload a reference image (suspect photo) for face re-ID."""
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported image format '{ext}'. Allowed: {', '.join(ALLOWED_IMAGE_EXTENSIONS)}",
        )

    ref_id = str(uuid.uuid4())[:8]
    safe_name = f"{ref_id}{ext}"
    ref_path = REFERENCES_DIR / safe_name

    with open(ref_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    meta = {
        "id": ref_id,
        "original_filename": file.filename,
        "stored_filename": safe_name,
        "label": label,
        "upload_time": time.time(),
        "image_url": f"/storage/references/{safe_name}",
    }
    (REFERENCES_DIR / f"{ref_id}.meta.json").write_text(json.dumps(meta, indent=2))

    return JSONResponse(status_code=201, content={"success": True, "reference": meta})


@router.get("/list")
def list_references():
    """List all uploaded reference images."""
    refs = []
    for meta_file in sorted(REFERENCES_DIR.glob("*.meta.json")):
        try:
            meta = json.loads(meta_file.read_text())
            refs.append(meta)
        except Exception:
            continue
    return {"references": refs, "count": len(refs)}


@router.delete("/{ref_id}")
def delete_reference(ref_id: str):
    """Delete a reference image."""
    meta_file = REFERENCES_DIR / f"{ref_id}.meta.json"
    if not meta_file.exists():
        raise HTTPException(status_code=404, detail="Reference not found")

    meta = json.loads(meta_file.read_text())
    ref_path = REFERENCES_DIR / meta["stored_filename"]
    if ref_path.exists():
        ref_path.unlink()
    meta_file.unlink()

    return {"success": True, "deleted_id": ref_id}
