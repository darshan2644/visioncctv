/**
 * VisionCCTV API client
 * All calls go to http://localhost:8000
 */

export function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== "undefined") {
    return `http://${window.location.hostname}:8000`;
  }
  return "http://localhost:8000";
}

export async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const baseUrl = getBaseUrl();
  try {
    const res = await fetch(`${baseUrl}${path}`, options);
    if (!res.ok) {
      let message = `HTTP ${res.status}`;
      try {
        const data = await res.json();
        if (data.detail) {
          message = typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail);
        }
      } catch {
        const text = await res.text();
        if (text) message = text;
      }
      throw new Error(message);
    }
    return res.json() as Promise<T>;
  } catch (err: any) {
    if (err.name === "TypeError" && err.message === "Failed to fetch") {
      throw new Error("Cannot connect to backend server at " + baseUrl + ". Please ensure the FastAPI backend is running.");
    }
    throw err;
  }
}


// ─── Types ──────────────────────────────────────────

export interface VideoMeta {
  id: string;
  original_filename?: string;
  stored_filename?: string;
  filename?: string;
  camera_id: string;
  upload_time: number;
  size_bytes: number;
  duration_seconds: number | null;
  thumbnail_url?: string | null;
}

export interface ReferenceMeta {
  id: string;
  original_filename?: string;
  stored_filename?: string;
  label: string;
  upload_time: number;
  image_url?: string;
}

export interface MatchResult {
  camera_id: string;
  timestamp: number;
  timestamp_str: string;
  frame_url: string;
  clip_url?: string;
  confidence: number;
  label: string;
  search_type: "face_recognition" | "keyword";
  box?: { x1: number; y1: number; x2: number; y2: number };
}

export interface SearchJob {
  status: "queued" | "running" | "completed" | "failed";
  type: string;
  match_count: number;
  matches?: MatchResult[];
  error?: string;
}

// ─── Videos ─────────────────────────────────────────

export async function listVideos(): Promise<{ videos: VideoMeta[]; count: number }> {
  return apiFetch("/api/videos/list");
}

export async function uploadVideo(
  file: File,
  cameraId: string
): Promise<{ success: boolean; video: VideoMeta }> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("camera_id", cameraId);
  return apiFetch("/api/videos/upload", { method: "POST", body: fd });
}

export async function deleteVideo(id: string): Promise<void> {
  await apiFetch(`/api/videos/${id}`, { method: "DELETE" });
}

// ─── References ─────────────────────────────────────

export async function listReferences(): Promise<{ references: ReferenceMeta[]; count: number }> {
  return apiFetch("/api/references/list");
}

export async function uploadReference(
  file: File,
  label: string
): Promise<{ success: boolean; reference: ReferenceMeta }> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("label", label);
  return apiFetch("/api/references/upload", { method: "POST", body: fd });
}

export async function deleteReference(id: string): Promise<void> {
  await apiFetch(`/api/references/${id}`, { method: "DELETE" });
}

// ─── Search ─────────────────────────────────────────

export async function startImageSearch(
  videoIds: string[],
  referenceIds: string[],
  confidenceThreshold = 0.65,
  similarityThreshold = 0.70,
  sampleFps = 1.0
): Promise<{ job_id: string; status: string }> {
  return apiFetch("/api/search/by-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      video_ids: videoIds,
      reference_ids: referenceIds,
      confidence_threshold: confidenceThreshold,
      similarity_threshold: similarityThreshold,
      sample_fps: sampleFps,
    }),
  });
}

export async function startKeywordSearch(
  videoIds: string[],
  keyword: string,
  similarityThreshold = 0.25,
  sampleFps = 1.0
): Promise<{ job_id: string; status: string }> {
  return apiFetch("/api/search/by-keyword", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      video_ids: videoIds,
      keyword,
      similarity_threshold: similarityThreshold,
      sample_fps: sampleFps,
    }),
  });
}

export async function getJobStatus(jobId: string): Promise<SearchJob> {
  return apiFetch(`/api/search/job/${jobId}`);
}

// ─── Export ──────────────────────────────────────────

export async function exportReport(
  jobId: string,
  title: string,
  investigator: string
): Promise<Blob> {
  const res = await fetch(`${getBaseUrl()}/api/export/report`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ job_id: jobId, title, investigator }),
  });
  if (!res.ok) throw new Error(`Export failed: HTTP ${res.status}`);
  return res.blob();
}

export function resolveStorageUrl(path: string): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${getBaseUrl()}${path}`;
}

