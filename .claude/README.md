# VisionCCTV Claude Agents

This directory contains project-specific Claude agents tailored for the VisionCCTV AI-powered CCTV analysis tool.

## Available Agents

### 🤖 VisionCCTV AI Architect
**File**: `visioncctv-ai-architect.md`
**Color**: Cyan
**Specialization**: AI pipeline development using YOLOv8, FaceNet, and CLIP models

**Use for**:
- Designing face detection and recognition pipelines
- Implementing keyword search with CLIP
- Optimizing video processing workflows
- Integrating computer vision models
- Performance tuning of AI components

### 🔍 VisionCCTV Code Reviewer
**File**: `visioncctv-code-reviewer.md`
**Color**: Red
**Specialization**: Comprehensive code review for Python/FastAPI backend and Next.js/TypeScript frontend

**Use for**:
- Reviewing AI pipeline implementations
- Evaluating API endpoint security and performance
- Assessing frontend component quality
- Identifying code structure improvements
- Validating testing strategies

### 📚 VisionCCTV Documentation Generator
**File**: `visioncctv-documentation-generator.md`
**Color**: Orange
**Specialization**: Creating comprehensive project documentation

**Use for**:
- Generating API documentation for FastAPI endpoints
- Documenting AI pipeline architecture
- Creating system diagrams and workflows
- Writing user guides and tutorials
- Maintaining technical specifications

### 🎯 VisionCCTV Workflow Router
**File**: `visioncctv-workflow-router.md`
**Color**: Blue
**Specialization**: Intelligent task routing to appropriate agents

**Use for**:
- Determining which agent should handle a task
- Routing AI pipeline tasks to AI Architect
- Sending code review requests to Code Reviewer
- Directing documentation tasks to Documentation Generator
- Handling ambiguous or cross-domain requests

## Agent Selection Guide

| Task Type | Recommended Agent |
|---|---|
| **AI Model Integration** | VisionCCTV AI Architect |
| **Face Detection/Recognition** | VisionCCTV AI Architect |
| **Keyword Search Implementation** | VisionCCTV AI Architect |
| **Video Processing Optimization** | VisionCCTV AI Architect |
| **Code Quality Review** | VisionCCTV Code Reviewer |
| **Security Analysis** | VisionCCTV Code Reviewer |
| **Performance Optimization** | VisionCCTV Code Reviewer |
| **API Documentation** | VisionCCTV Documentation Generator |
| **System Architecture Diagrams** | VisionCCTV Documentation Generator |
| **User Guides** | VisionCCTV Documentation Generator |
| **Task Routing** | VisionCCTV Workflow Router |
| **Ambiguous Requests** | VisionCCTV Workflow Router |

## Usage Patterns

### Direct Agent Usage
```bash
# For AI pipeline development
claude --agent visioncctv-ai-architect "Implement face recognition using YOLOv8"

# For code review
claude --agent visioncctv-code-reviewer "Review my face detection implementation"

# For documentation
claude --agent visioncctv-documentation-generator "Create API docs for search endpoints"
```

### Routing Through Workflow Agent
```bash
# Let the router decide
claude --agent visioncctv-workflow-router "Help me optimize the CLIP search performance"
```

## Project Context

All agents are configured with deep knowledge of:
- **Backend**: FastAPI (Python 3.10+)
- **Frontend**: Next.js 14 (TypeScript)
- **AI Models**: YOLOv8, FaceNet, CLIP
- **Video Processing**: OpenCV
- **Storage Structure**: `backend/storage/` organization

## Configuration

Agent settings are defined in `settings.local.json` and respect the project-specific rules in the root `claude.md` file.

## Best Practices

1. **Start with Workflow Router** for ambiguous tasks
2. **Use AI Architect** for all AI pipeline work
3. **Route to Code Reviewer** after major implementations
4. **Update Documentation** after significant changes
5. **Follow project conventions** defined in `claude.md`