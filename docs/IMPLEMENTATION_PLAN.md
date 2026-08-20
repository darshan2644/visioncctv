# 🎯 VisionCCTV – AI-Powered CCTV Analysis Tool
## Implementation Plan

---

## Problem Statement

Investigators manually reviewing hours of CCTV footage waste critical investigation time. This tool automates the detection and extraction of relevant frames using AI — reducing hours of manual work to seconds.

---

## Gap Analysis: Current Repo vs. Hackathon Goals

| Requirement | Current State | Gap |
|---|---|---|
| Ingest raw CCTV footage (.mp4, .avi, .mov) | ✅ Basic OpenCV reading | ❌ No UI for upload, only hardcoded path |
| Batch upload from multiple cameras | ❌ Not implemented | Needs batch upload system |
| Search by reference image (face re-ID) | ✅ YOLOv8 + FaceNet exists | ❌ Notebook-only, no API, no clip extraction |
| Search by keyword (NLP) | ❌ Not implemented | Needs CLIP or YOLOv8 object detection |
| Timestamped result display | ❌ Outputs whole video | Needs frame extraction by timestamp |
| Export clips / reports | ❌ Downloads full result video | Needs selective clip + PDF report export |
| Camera ID tagging | ❌ Not implemented | Needs metadata attachment per upload |
| Web UI / Desktop UI | ❌ Jupyter Notebook only | Needs full frontend |

---

## Architecture

```
d:\VisionCCTV\
├── IMPLEMENTATION_PLAN.md         ← This file
├── Face-Detection-and-Recognition-with-YOLOv8-and-FaceNet-PyTorch-main/  ← Original source
├── backend/                       ← FastAPI Python backend
│   ├── main.py                    ← API entry point
│   ├── requirements.txt           ← Python deps
│   ├── ai_pipeline/
│   │   ├── face_recognition.py    ← YOLOv8 + FaceNet pipeline
│   │   ├── keyword_search.py      ← CLIP-based NLP search
│   │   └── frame_extractor.py     ← Extract frames/clips from timestamps
│   ├── routers/
│   │   ├── videos.py              ← /upload_video, /list_videos
│   │   ├── search.py              ← /search_by_image, /search_by_keyword
│   │   └── export.py              ← /export_clip, /export_report
│   └── storage/
│       ├── uploads/               ← Uploaded CCTV footage
│       ├── references/            ← Uploaded suspect/reference images
│       └── results/               ← Extracted frames and clips
└── frontend/                      ← Next.js web app
    ├── app/
    │   ├── page.tsx               ← Dashboard / Home
    │   ├── upload/page.tsx        ← Video upload page
    │   ├── search/page.tsx        ← Search interface
    │   └── results/page.tsx       ← Results viewer
    └── components/
        ├── VideoUploader.tsx
        ├── SearchPanel.tsx
        ├── ResultsGrid.tsx
        └── ExportBar.tsx
```

---

## Feature Priority & Implementation Order

Features are ordered from **easiest to most complex**:

### Phase 1: Foundation (Backend Setup) ← START HERE
**Difficulty: ⭐**
- [x] Create FastAPI project structure with CORS
- [x] Health check endpoint `/health`
- [x] Storage directory setup

### Phase 2: Video Upload & Management
**Difficulty: ⭐⭐**
- [x] POST `/upload_video` — Multipart file upload (mp4, avi, mov)
- [x] GET `/list_videos` — List uploaded videos with metadata
- [x] Video thumbnail extraction on upload (first frame saved as JPEG)

### Phase 3: Reference Image Upload
**Difficulty: ⭐⭐**
- [x] POST `/upload_reference` — Upload suspect/reference images
- [x] GET `/list_references` — List all reference images

### Phase 4: Frame Extraction Engine
**Difficulty: ⭐⭐⭐**
- [x] Frame extractor utility — read video, sample every N frames
- [x] Save matching frames with timestamp metadata
- [x] Generate short video clips (±5s window) from matching timestamps

### Phase 5: Face Recognition Search
**Difficulty: ⭐⭐⭐⭐**
- [x] Refactor notebook code into `face_recognition.py`
- [x] POST `/search_by_image` — Run face re-ID on uploaded videos
- [x] Return JSON: `[{camera_id, timestamp, frame_path, confidence}]`

### Phase 6: Keyword Search (CLIP)
**Difficulty: ⭐⭐⭐⭐**
- [x] Integrate OpenAI CLIP model
- [x] POST `/search_by_keyword` — Run text-to-image similarity on frames
- [x] Return matching frames with similarity scores

### Phase 7: Frontend (Next.js)
**Difficulty: ⭐⭐⭐⭐⭐**
- [x] Premium dark-mode dashboard
- [x] Drag-and-drop video upload with camera ID tagging
- [x] Toggle between Image Search and Keyword Search
- [x] Results grid (frames + timestamp + confidence + camera ID)
- [x] Export: Download clip, Download frame, Export PDF report

### Phase 8: Export & Reporting
**Difficulty: ⭐⭐⭐**
- [x] Clip export (MP4 ±5s window around match)
- [x] PDF report generation (forensic-friendly layout)
- [x] Annotated image download (bounding box overlaid)

---

## Tech Stack

| Layer | Technology | Reason |
|---|---|---|
| Frontend | Next.js 14 + TypeScript | Modern, fast, premium UI |
| Styling | Vanilla CSS (custom design system) | Full design control |
| Backend | FastAPI (Python 3.10+) | Async, fast, AI-friendly |
| Face Detection | YOLOv8n-face-keypoints | Already in repo, proven |
| Face Recognition | FaceNet-PyTorch (InceptionResNetV1) | Already in repo, proven |
| Keyword Search | OpenAI CLIP (ViT-B/32 via HuggingFace) | Best-in-class open-vocab image-text matching |
| Video I/O | OpenCV | Industry standard |
| Report Export | ReportLab (PDF) | Forensic PDF generation |

---

## Dependencies

### Python (backend/requirements.txt)
```
fastapi>=0.104.0
uvicorn[standard]>=0.24.0
python-multipart>=0.0.6
opencv-python>=4.8.0
torch>=2.0.0
torchvision>=0.15.0
facenet-pytorch>=2.5.3
ultralytics>=8.0.0
transformers>=4.35.0   # for CLIP
Pillow>=10.0.0
numpy>=1.24.0
reportlab>=4.0.0
aiofiles>=23.0.0
```

---

## Key Design Decisions

1. **Frame Sampling:** Process 1 frame per second (FPS reduction) during search to balance speed and accuracy. Can be configured.
2. **CLIP for Keyword Search:** Unlike custom object detectors, CLIP can match arbitrary natural language queries ("man in red jacket running") without needing per-class training data.
3. **Non-destructive Pipeline:** Original videos are never modified. All outputs are saved in `storage/results/`.
4. **Camera ID:** Set at upload time as a metadata field, stored in a lightweight JSON index file per upload.
5. **Forensic Export:** PDF reports include: camera ID, timestamp, frame image, confidence score, search query, and generation time.
