# 🎯 VisionCCTV – AI-Powered CCTV Analysis Tool

## Claude Project Configuration

This file defines project-specific rules and context for Claude agents working on the VisionCCTV codebase.

### Project Overview

**VisionCCTV** is an AI-powered CCTV analysis tool that automates the detection and extraction of relevant frames from surveillance footage using:
- **YOLOv8** for face detection
- **FaceNet** for face recognition
- **CLIP** for keyword-based image search
- **FastAPI** backend with Python
- **Next.js** frontend with TypeScript

### Repository Structure

```
d:
VisionCCTV/
├── IMPLEMENTATION_PLAN.md         ← Project roadmap and architecture
├── claude.md                      ← This file (project-specific rules)
├── .claude/
│   ├── agents/                    ← Project-specific agent definitions
│   └── settings.local.json        ← Local Claude settings
├── backend/                       ← FastAPI Python backend
│   ├── main.py                    ← API entry point
│   ├── requirements.txt           ← Python dependencies
│   ├── ai_pipeline/              ← AI processing modules
│   ├── routers/                   ← API route handlers
│   └── storage/                   ← File storage (uploads, results)
├── frontend/                      ← Next.js web application
│   ├── app/                      ← Next.js pages and routes
│   ├── components/               ← React components
│   └── public/                   ← Static assets
└── Face-Detection-and-Recognition-with-YOLOv8-and-FaceNet-PyTorch-main/
    └── Original source code (reference)
```

### Technology Stack

| Layer | Technology | Version |
|---|---|---|
| **Frontend** | Next.js | 14.x |
| **Styling** | Vanilla CSS | - |
| **Backend** | FastAPI | 0.104.0+ |
| **Python** | Python | 3.10+ |
| **Face Detection** | YOLOv8n-face-keypoints | Ultralytics 8.0.0+ |
| **Face Recognition** | FaceNet-PyTorch | InceptionResNetV1 |
| **Keyword Search** | OpenAI CLIP | ViT-B/32 via HuggingFace |
| **Video Processing** | OpenCV | 4.8.0+ |
| **Report Generation** | ReportLab | 4.0.0+ |

### Key Project Files

#### Backend (Python/FastAPI)
- `backend/main.py` - FastAPI application entry point
- `backend/ai_pipeline/face_recognition.py` - YOLOv8 + FaceNet pipeline
- `backend/ai_pipeline/keyword_search.py` - CLIP-based NLP search
- `backend/ai_pipeline/frame_extractor.py` - Video frame extraction
- `backend/routers/videos.py` - Video upload endpoints
- `backend/routers/search.py` - Search functionality
- `backend/routers/export.py` - Export clips and reports

#### Frontend (Next.js/TypeScript)
- `frontend/app/page.tsx` - Dashboard/home page
- `frontend/app/upload/page.tsx` - Video upload interface
- `frontend/app/search/page.tsx` - Search interface
- `frontend/app/results/page.tsx` - Results viewer
- `frontend/components/` - React components

### Development Guidelines

#### Python Backend
- **Type Hints**: Use Python type hints for all functions
- **Error Handling**: Comprehensive error handling with meaningful messages
- **Async/Await**: Use async/await for I/O operations
- **File Storage**: Store uploaded files in `backend/storage/uploads/`
- **Results**: Save processed results in `backend/storage/results/`

#### TypeScript Frontend
- **Strict Mode**: Use TypeScript strict mode
- **Component Structure**: Follow Next.js app router conventions
- **Styling**: Use vanilla CSS with BEM-like naming
- **API Calls**: Use fetch API for backend communication

### API Endpoints

#### Video Management
- `POST /upload_video` - Upload CCTV footage
- `GET /list_videos` - List uploaded videos
- `POST /upload_reference` - Upload reference images
- `GET /list_references` - List reference images

#### Search Functionality
- `POST /search_by_image` - Face recognition search
- `POST /search_by_keyword` - Keyword-based search using CLIP

#### Export Functionality
- `POST /export_clip` - Export video clips
- `POST /export_report` - Generate PDF reports

### AI Pipeline Details

#### Frame Processing
- **Sampling Rate**: 1 frame per second (configurable)
- **Frame Storage**: JPEG format with timestamp metadata
- **Clip Generation**: ±5 second window around matches

#### Face Recognition
- **Detection**: YOLOv8n-face-keypoints model
- **Embedding**: FaceNet InceptionResNetV1
- **Similarity**: Cosine similarity threshold (configurable)

#### Keyword Search
- **Model**: OpenAI CLIP ViT-B/32
- **Input**: Natural language queries
- **Output**: Similarity scores for each frame

### Storage Structure

```
backend/storage/
├── uploads/               # Original uploaded videos
├── references/            # Reference images for face search
├── results/               # Processed frames and clips
├── thumbnails/            # Video thumbnails
└── index.json             # Metadata index
```

### Testing Strategy

- **Backend**: Use pytest for API endpoint testing
- **Frontend**: Use Jest/React Testing Library
- **Integration**: Test API endpoints with frontend components
- **E2E**: Consider Cypress for end-to-end testing

### Performance Considerations

- **Video Processing**: Process frames asynchronously
- **Caching**: Cache face embeddings for reference images
- **Batch Processing**: Support batch uploads from multiple cameras
- **Memory Management**: Clean up temporary files after processing

### Security Guidelines

- **File Uploads**: Validate file types and sizes
- **Authentication**: Implement JWT for API security
- **Data Privacy**: Handle surveillance data with care
- **Input Validation**: Sanitize all user inputs

### Documentation Standards

- **Code Comments**: Use docstrings for functions and classes
- **API Documentation**: Swagger/OpenAPI for backend endpoints
- **README Files**: Include setup and usage instructions
- **CHANGELOG**: Track version changes and features

### Agent-Specific Rules

1. **Always** respect the existing codebase structure
2. **Follow** the technology stack defined in this document
3. **Use** the project-specific agents in `.claude/agents/`
4. **Maintain** consistent coding style across the project
5. **Document** all changes and new features

### Project-Specific Agents

The following agents are available in `.claude/agents/`:

- **code-reviewer.md** - Comprehensive code review and quality assessment
- **documentation-generator.md** - API docs, code structure, database diagrams
- **graphql-typescript-architect.md** - GraphQL/TypeScript architecture (adapted for this project)
- **sequelize-database-architect.md** - Database design specialist
- **workflow-router.md** - Intelligent task routing

Each agent has been customized for the VisionCCTV project requirements.

### Version Control

- **Main Branch**: `main` (protected)
- **Feature Branches**: `feature/*` prefix
- **Release Tags**: `v*.*.*` format
- **Commit Messages**: Use conventional commits format

### Continuous Integration

- **Linting**: Run ESLint and Python linters
- **Testing**: Run unit and integration tests
- **Build**: Verify frontend and backend builds
- **Security**: Run vulnerability scans

### Deployment Strategy

- **Development**: Local development with hot reload
- **Staging**: Test environment for QA
- **Production**: Docker containers with proper orchestration

### Monitoring and Logging

- **Backend**: Structured logging with timestamps
- **Frontend**: Error tracking and analytics
- **Performance**: Monitor API response times
- **Errors**: Centralized error logging

### Contribution Guidelines

1. **Fork** the repository
2. **Create** a feature branch
3. **Implement** your changes
4. **Test** thoroughly
5. **Document** your work
6. **Submit** a pull request

### Support and Maintenance

- **Issue Tracking**: Use GitHub Issues
- **Bug Reports**: Include reproduction steps
- **Feature Requests**: Describe use cases
- **Documentation**: Keep updated with code changes

This `claude.md` file serves as the authoritative reference for all Claude agents working on the VisionCCTV project. Always consult this document when making decisions about code structure, technology choices, and development practices.