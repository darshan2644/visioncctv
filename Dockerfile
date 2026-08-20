# VisionCCTV Dockerfile
# Multi-stage build for Python backend and Next.js frontend

# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend files
COPY frontend/package.json frontend/package-lock.json ./
RUN npm install

COPY frontend/ ./

# Build the Next.js application
RUN npm run build

# Stage 2: Python backend with frontend static files
FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libsm6 \
    libxext6 \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Create and set working directory
WORKDIR /app

# Install Python dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend files
COPY backend/ ./backend

# Copy built frontend files from builder
COPY --from=frontend-builder /app/frontend/out ./frontend/out
COPY --from=frontend-builder /app/frontend/public ./frontend/public
COPY --from=frontend-builder /app/frontend/package.json ./frontend/package.json

# Copy the original YOLOv8 model and demo files
COPY Face-Detection-and-Recognition-with-YOLOv8-and-FaceNet-PyTorch-main/yolov8n-face-keypoints.pt ./backend/
COPY Face-Detection-and-Recognition-with-YOLOv8-and-FaceNet-PyTorch-main/subway.mp4 ./backend/storage/uploads/
COPY Face-Detection-and-Recognition-with-YOLOv8-and-FaceNet-PyTorch-main/database/*.jpg ./backend/storage/references/

# Create storage directories and set permissions
RUN mkdir -p ./backend/storage/uploads \
    ./backend/storage/references \
    ./backend/storage/results \
    ./backend/storage/thumbnails \
    && chmod -R 777 ./backend/storage

# Environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000 \
    FRONTEND_PORT=3000

# Expose ports
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
    CMD curl -f http://localhost:8000/health || exit 1

# Command to run the application
CMD ["sh", "-c", "cd backend && uvicorn main:app --host 0.0.0.0 --port 8000 --reload"]