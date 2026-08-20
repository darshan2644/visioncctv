"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/AppLayout";
import ToastProvider, { showToast } from "@/components/ToastProvider";
import {
  listVideos, listReferences,
  startImageSearch, startKeywordSearch, getJobStatus, resolveStorageUrl,
  VideoMeta, ReferenceMeta, SearchJob, MatchResult,
} from "@/lib/api";


type SearchMode = "image" | "keyword";

export default function SearchPage() {
  const router = useRouter();
  const [mode, setMode] = useState<SearchMode>("image");
  const [videos, setVideos] = useState<VideoMeta[]>([]);
  const [refs, setRefs] = useState<ReferenceMeta[]>([]);
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set());
  const [selectedRefs, setSelectedRefs] = useState<Set<string>>(new Set());
  const [keyword, setKeyword] = useState("");
  const [sampleFps, setSampleFps] = useState(1.0);
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.65);
  const [similarityThreshold, setSimilarityThreshold] = useState(mode === "image" ? 0.70 : 0.25);
  const [jobId, setJobId] = useState<string | null>(null);
  const [job, setJob] = useState<SearchJob | null>(null);
  const [polling, setPolling] = useState(false);
  const [loading, setLoading] = useState(true);
  const [autoNavigate, setAutoNavigate] = useState(true);

  useEffect(() => {
    setSimilarityThreshold(mode === "image" ? 0.70 : 0.25);
  }, [mode]);

  useEffect(() => {
    async function load() {
      try {
        const [v, r] = await Promise.all([listVideos(), listReferences()]);
        setVideos(v.videos);
        setRefs(r.references);
        // Auto-select all
        setSelectedVideos(new Set(v.videos.map((vv) => vv.id)));
        setSelectedRefs(new Set(r.references.map((r) => r.id)));
      } catch {
        showToast("Failed to load assets", "error");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Poll job status
  const pollJob = useCallback(async (id: string) => {
    setPolling(true);
    const interval = setInterval(async () => {
      try {
        const status = await getJobStatus(id);
        setJob(status);
        if (status.status === "completed" || status.status === "failed") {
          clearInterval(interval);
          setPolling(false);
          if (status.status === "completed") {
            showToast(`✅ ${status.match_count} match${status.match_count !== 1 ? "es" : ""} found — navigating to results…`, "success");
            // Auto-navigate to results with job ID
            setTimeout(() => router.push(`/results#${id}`), 1200);
          } else {
            showToast(`Search failed: ${status.error}`, "error");
          }
        }
      } catch {
        clearInterval(interval);
        setPolling(false);
      }
    }, 2000);
  }, [router, autoNavigate]);

  const handleSearch = async () => {
    if (selectedVideos.size === 0) { showToast("Select at least one video", "error"); return; }
    if (mode === "image" && selectedRefs.size === 0) { showToast("Select at least one reference image", "error"); return; }
    if (mode === "keyword" && !keyword.trim()) { showToast("Enter a search keyword", "error"); return; }

    try {
      let result: { job_id: string; status: string };
      if (mode === "image") {
        result = await startImageSearch(
          Array.from(selectedVideos),
          Array.from(selectedRefs),
          confidenceThreshold,
          similarityThreshold,
          sampleFps
        );
      } else {
        result = await startKeywordSearch(
          Array.from(selectedVideos),
          keyword.trim(),
          similarityThreshold,
          sampleFps
        );
      }
      setJobId(result.job_id);
      setJob({ status: "queued", type: mode, match_count: 0 });
      showToast(`🔍 Search started (Job: ${result.job_id})`, "info");
      pollJob(result.job_id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Search failed";
      showToast(msg, "error");
    }
  };

  const toggleVideo = (id: string) =>
    setSelectedVideos((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const toggleRef = (id: string) =>
    setSelectedRefs((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  return (
    <ToastProvider>
      <AppLayout>
        <div className="page-header">
          <h1 className="page-title">🔍 Search Footage</h1>
          <p className="page-subtitle">
            Run AI-powered search across your CCTV footage by face or keyword.
          </p>
        </div>

        {/* Mode Tabs */}
        <div className="tab-group">
          <button className={`tab ${mode === "image" ? "active" : ""}`} onClick={() => setMode("image")}>
            👤 Face Re-ID
          </button>
          <button className={`tab ${mode === "keyword" ? "active" : ""}`} onClick={() => setMode("keyword")}>
            💬 Keyword Search
          </button>
        </div>

        <div className="grid-2" style={{ gap: 24, alignItems: "start" }}>
          {/* Left: Query Setup */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Query Input */}
            <div className="card">
              <div className="section-title">
                {mode === "image" ? "Select Reference Images" : "Keyword Query"}
              </div>

              {mode === "keyword" ? (
                <>
                  <div className="input-group">
                    <label className="input-label">Search Query</label>
                    <input
                      className="input-field"
                      placeholder='e.g. "person in red jacket", "white van", "man with bag"'
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    />
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
                    💡 Powered by CLIP — supports natural language. Try: <em>"person running", "car crash", "police uniform"</em>
                  </div>
                </>
              ) : (
                <div>
                  {loading ? (
                    <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>Loading references…</div>
                  ) : refs.length === 0 ? (
                    <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                      No references found. <a href="/suspects" style={{ color: "var(--accent)" }}>Add some →</a>
                    </div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: 8 }}>
                      {refs.map((ref) => (
                        <div
                          key={ref.id}
                          onClick={() => toggleRef(ref.id)}
                          style={{
                            cursor: "pointer",
                            borderRadius: 8,
                            overflow: "hidden",
                            border: `2px solid ${selectedRefs.has(ref.id) ? "var(--accent)" : "var(--border)"}`,
                            transition: "var(--transition)",
                            position: "relative",
                          }}
                        >
                          {ref.image_url ? (
                            <img
                              src={resolveStorageUrl(ref.image_url)}
                              alt={ref.label}
                              style={{ width: "100%", height: 70, objectFit: "cover" }}
                            />
                          ) : (
                            <div style={{ width: "100%", height: 70, background: "var(--bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>👤</div>
                          )}
                          {selectedRefs.has(ref.id) && (
                            <div style={{
                              position: "absolute", top: 4, right: 4,
                              width: 16, height: 16, borderRadius: "50%",
                              background: "var(--accent)", display: "flex",
                              alignItems: "center", justifyContent: "center",
                              fontSize: "0.6rem", color: "white", fontWeight: 800,
                            }}>✓</div>
                          )}
                          <div style={{ padding: "4px 6px", fontSize: "0.65rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {ref.label}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Advanced Settings */}
            <div className="card">
              <div className="section-title">Search Settings</div>
              <div className="input-group">
                <label className="input-label">Frame Sample Rate (per second): {sampleFps}</label>
                <input type="range" min={0.1} max={5} step={0.1} value={sampleFps} onChange={(e) => setSampleFps(Number(e.target.value))} style={{ width: "100%", accentColor: "var(--accent)" }} />
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Higher = more thorough but slower. 1 fps recommended for most cases.</div>
              </div>
              {mode === "image" && (
                <div className="input-group">
                  <label className="input-label">Face Detection Confidence: {(confidenceThreshold * 100).toFixed(0)}%</label>
                  <input type="range" min={0.3} max={0.95} step={0.05} value={confidenceThreshold} onChange={(e) => setConfidenceThreshold(Number(e.target.value))} style={{ width: "100%", accentColor: "var(--accent)" }} />
                </div>
              )}
              <div className="input-group">
                <label className="input-label">Match Threshold: {(similarityThreshold * 100).toFixed(0)}%</label>
                <input type="range" min={0.1} max={0.95} step={0.05} value={similarityThreshold} onChange={(e) => setSimilarityThreshold(Number(e.target.value))} style={{ width: "100%", accentColor: "var(--accent)" }} />
              </div>
            </div>

            {/* Run Button */}
            <button
              className="btn btn-primary btn-lg"
              style={{ width: "100%", justifyContent: "center" }}
              onClick={handleSearch}
              disabled={polling}
            >
              {polling ? "⏳ Searching…" : "🔍 Run Search"}
            </button>
          </div>

          {/* Right: Video selection + Job status */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Video selector */}
            <div className="card">
              <div className="section-title">
                Select Videos ({selectedVideos.size}/{videos.length} selected)
              </div>
              {loading ? (
                <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>Loading…</div>
              ) : videos.length === 0 ? (
                <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                  No videos found. <a href="/upload" style={{ color: "var(--accent)" }}>Upload some →</a>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => setSelectedVideos(new Set(videos.map((v) => v.id)))}>All</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setSelectedVideos(new Set())}>None</button>
                  </div>
                  {videos.map((v) => (
                    <div
                      key={v.id}
                      className={`video-item ${selectedVideos.has(v.id) ? "selected" : ""}`}
                      style={{ cursor: "pointer" }}
                      onClick={() => toggleVideo(v.id)}
                    >
                      <input
                        type="checkbox"
                        className="video-checkbox"
                        checked={selectedVideos.has(v.id)}
                        onChange={() => {}}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="video-thumb">
                        {v.thumbnail_url ? (
                          <img src={resolveStorageUrl(v.thumbnail_url)} alt={v.camera_id} />
                        ) : "🎬"}
                      </div>
                      <div className="video-info">
                        <div className="video-name">{v.original_filename || v.filename || v.id}</div>
                        <div className="video-meta">
                          <span>📹 {v.camera_id}</span>
                          {v.duration_seconds && <><span>·</span><span>{v.duration_seconds.toFixed(0)}s</span></>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Job Status */}
            {job && (
              <div className="card" style={{ borderColor: job.status === "completed" ? "rgba(0,255,136,0.3)" : job.status === "failed" ? "rgba(233,69,96,0.3)" : "var(--border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div className="section-title" style={{ marginBottom: 0 }}>Job Status</div>
                  <span className={`status-pill status-${job.status}`}>{job.status}</span>
                </div>
                {jobId && <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: 8 }}>ID: <span className="mono">{jobId}</span></div>}

                {(job.status === "running" || job.status === "queued") && (
                  <div className="progress-bar" style={{ marginBottom: 8 }}>
                    <div className="progress-bar-fill pulse" style={{ width: "100%", animation: "pulse 1.5s infinite" }} />
                  </div>
                )}

                {job.status === "completed" && (
                  <div>
                    <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--green)", marginBottom: 6 }}>
                      🎯 {job.match_count} Match{job.match_count !== 1 ? "es" : ""} Found
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: 10 }}>Auto-navigating to results…</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <a href={`/results#${jobId}`} className="btn btn-primary btn-sm">View Results Now →</a>
                    </div>
                  </div>
                )}

                {job.status === "failed" && (
                  <div style={{ color: "var(--accent)", fontSize: "0.8rem" }}>
                    Error: {job.error || "Unknown error"}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </AppLayout>
    </ToastProvider>
  );
}
