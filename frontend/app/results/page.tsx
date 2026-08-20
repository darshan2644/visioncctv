"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import AppLayout from "@/components/AppLayout";
import ToastProvider, { showToast } from "@/components/ToastProvider";
import { getJobStatus, exportReport, resolveStorageUrl, MatchResult, SearchJob } from "@/lib/api";

const BASE_URL = "http://localhost:8000";

// ── Timeline Scrubber Component ───────────────────────────────────────
function TimelineScrubber({
  matches,
  totalDuration,
  onSelect,
  selected,
}: {
  matches: MatchResult[];
  totalDuration: number;
  onSelect: (m: MatchResult) => void;
  selected: MatchResult | null;
}) {
  const duration = totalDuration || (matches.length > 0 ? matches[matches.length - 1].timestamp + 10 : 60);

  return (
    <div style={{
      background: "var(--bg-elevated)", borderRadius: "var(--radius-md)",
      padding: "16px 20px", marginBottom: 24,
      border: "1px solid var(--border)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div className="section-title" style={{ marginBottom: 0 }}>
          📊 Evidence Timeline — {matches.length} match{matches.length !== 1 ? "es" : ""}
        </div>
        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontFamily: "JetBrains Mono, monospace" }}>
          0s — {duration.toFixed(0)}s
        </div>
      </div>

      {/* Track */}
      <div style={{ position: "relative", height: 40, cursor: "pointer" }}>
        {/* Base track */}
        <div style={{
          position: "absolute", top: "50%", left: 0, right: 0,
          height: 4, background: "rgba(255,255,255,0.06)",
          borderRadius: 2, transform: "translateY(-50%)",
        }} />

        {/* Filled region */}
        {matches.length > 0 && (
          <div style={{
            position: "absolute", top: "50%", left: 0,
            width: `${(matches[matches.length - 1].timestamp / duration) * 100}%`,
            height: 4, background: "linear-gradient(90deg, var(--accent), rgba(233,69,96,0.3))",
            borderRadius: 2, transform: "translateY(-50%)",
          }} />
        )}

        {/* Match markers */}
        {matches.map((m, i) => {
          const pct = (m.timestamp / duration) * 100;
          const isSelected = selected === m;
          return (
            <div
              key={i}
              onClick={() => onSelect(m)}
              title={`${m.timestamp_str} — ${m.label} (${(m.confidence * 100).toFixed(0)}%)`}
              style={{
                position: "absolute",
                left: `${pct}%`,
                top: "50%",
                transform: "translate(-50%, -50%)",
                width: isSelected ? 14 : 10,
                height: isSelected ? 14 : 10,
                borderRadius: "50%",
                background: isSelected ? "var(--cyan)" : "var(--accent)",
                border: `2px solid ${isSelected ? "white" : "rgba(233,69,96,0.5)"}`,
                boxShadow: isSelected ? "0 0 12px var(--cyan)" : "0 0 6px rgba(233,69,96,0.6)",
                cursor: "pointer",
                zIndex: isSelected ? 2 : 1,
                transition: "all 0.15s ease",
              }}
            />
          );
        })}
      </div>

      {/* Labels */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
        {matches.map((m, i) => (
          <div
            key={i}
            onClick={() => onSelect(m)}
            style={{
              padding: "3px 8px", borderRadius: 100, cursor: "pointer",
              background: selected === m ? "rgba(0,212,255,0.15)" : "rgba(233,69,96,0.08)",
              border: `1px solid ${selected === m ? "rgba(0,212,255,0.4)" : "rgba(233,69,96,0.2)"}`,
              fontSize: "0.68rem", fontFamily: "JetBrains Mono, monospace",
              color: selected === m ? "var(--cyan)" : "var(--text-muted)",
              transition: "all 0.15s ease",
            }}
          >
            {m.timestamp_str}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Suspect Trail Component ───────────────────────────────────────────
function SuspectTrail({ matches }: { matches: MatchResult[] }) {
  if (matches.length === 0) return null;

  // Group by label
  const byLabel: Record<string, MatchResult[]> = {};
  matches.forEach((m) => {
    if (!byLabel[m.label]) byLabel[m.label] = [];
    byLabel[m.label].push(m);
  });

  return (
    <div style={{
      background: "linear-gradient(135deg, rgba(15,52,96,0.4), rgba(10,10,15,0.6))",
      border: "1px solid rgba(0,212,255,0.2)",
      borderRadius: "var(--radius-lg)", padding: "20px 24px", marginBottom: 24,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div style={{ fontSize: "1.2rem" }}>🗺</div>
        <div>
          <div style={{ fontWeight: 800, fontSize: "0.95rem" }}>Suspect Investigation Trail</div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
            Chronological evidence chain · {matches.length} sighting{matches.length !== 1 ? "s" : ""}
          </div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          {Object.keys(byLabel).map((label) => (
            <div key={label} style={{
              padding: "4px 10px", borderRadius: 100, fontSize: "0.72rem", fontWeight: 600,
              background: "rgba(0,212,255,0.1)", color: "var(--cyan)",
              border: "1px solid rgba(0,212,255,0.2)",
            }}>
              {label} · {byLabel[label].length}×
            </div>
          ))}
        </div>
      </div>

      {/* Timeline trail */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 0, overflowX: "auto", paddingBottom: 8 }}>
        {matches.slice(0, 10).map((m, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              {/* Thumbnail */}
              <div style={{
                width: 64, height: 48, borderRadius: 6, overflow: "hidden",
                border: "2px solid rgba(0,212,255,0.3)",
                background: "var(--bg-elevated)", flexShrink: 0,
              }}>
                {m.frame_url && (
                  <img
                    src={resolveStorageUrl(m.frame_url)}
                    alt={m.timestamp_str}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                )}
              </div>
              {/* Info */}
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "0.65rem", fontFamily: "JetBrains Mono, monospace", color: "var(--cyan)" }}>
                  {m.timestamp_str}
                </div>
                <div style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>
                  {m.camera_id}
                </div>
                <div style={{ fontSize: "0.6rem", color: "var(--green)", fontWeight: 700 }}>
                  {(m.confidence * 100).toFixed(0)}%
                </div>
              </div>
            </div>
            {/* Arrow connector */}
            {i < matches.slice(0, 10).length - 1 && (
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                padding: "0 6px", paddingBottom: 28,
              }}>
                <div style={{ width: 24, height: 2, background: "linear-gradient(90deg, rgba(0,212,255,0.4), rgba(233,69,96,0.4))" }} />
                <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", marginTop: 2 }}>→</div>
              </div>
            )}
          </div>
        ))}
        {matches.length > 10 && (
          <div style={{
            flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
            width: 64, height: 48, background: "var(--bg-elevated)",
            borderRadius: 6, border: "1px dashed var(--border)",
            fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600,
          }}>
            +{matches.length - 10}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Inline Video Player Modal ─────────────────────────────────────────
function VideoPlayerModal({
  match,
  onClose,
}: {
  match: MatchResult;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const handlePlay = () => setPlaying(true);
    const handlePause = () => setPlaying(false);
    el.addEventListener("play", handlePlay);
    el.addEventListener("pause", handlePause);
    return () => { el.removeEventListener("play", handlePlay); el.removeEventListener("pause", handlePause); };
  }, []);

  const downloadClip = () => {
    if (match.clip_url) {
      window.open(`${BASE_URL}/api/export/clip?clip_path=${encodeURIComponent(match.clip_url)}`, "_blank");
    }
  };

  const downloadFrame = () => {
    const a = document.createElement("a");
    a.href = resolveStorageUrl(match.frame_url);
    a.download = `evidence_${match.label}_${match.timestamp_str.replace(/:/g, "-")}.jpg`;
    a.target = "_blank";
    a.click();
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.9)",
        backdropFilter: "blur(12px)",
        zIndex: 300,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--bg-card)", border: "1px solid var(--border)",
          borderRadius: "var(--radius-xl)", overflow: "hidden",
          maxWidth: 760, width: "100%",
          boxShadow: "0 32px 80px rgba(0,0,0,0.8), 0 0 60px rgba(233,69,96,0.1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "14px 20px",
          background: "var(--bg-elevated)",
          borderBottom: "1px solid var(--border)",
        }}>
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "var(--accent)", animation: playing ? "pulse 1s infinite" : "none" }} />
          <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>
            Evidence Clip — {match.timestamp_str}
          </span>
          <span className="badge badge-cyan" style={{ marginLeft: "auto" }}>📹 {match.camera_id}</span>
          <span className="badge" style={{
            background: "var(--accent-dim)", color: "var(--accent)",
            border: "1px solid rgba(233,69,96,0.3)",
          }}>
            {(match.confidence * 100).toFixed(1)}% match
          </span>
          <button
            className="btn btn-ghost btn-sm"
            onClick={onClose}
            style={{ color: "var(--text-muted)" }}
          >✕</button>
        </div>

        {/* Video or Frame */}
        <div style={{ background: "#000", position: "relative" }}>
          {match.clip_url ? (
            <video
              ref={videoRef}
              src={resolveStorageUrl(match.clip_url)}
              controls
              autoPlay
              style={{ width: "100%", maxHeight: 420, display: "block", objectFit: "contain" }}
            />
          ) : (
            <img
              src={resolveStorageUrl(match.frame_url)}
              alt="Evidence frame"
              style={{ width: "100%", maxHeight: 420, objectFit: "contain", display: "block" }}
            />
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 20px" }}>
          {/* Metadata grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}>
            {[
              ["Label", match.label],
              ["Camera", match.camera_id],
              ["Time", match.timestamp_str],
              ["Confidence", `${(match.confidence * 100).toFixed(2)}%`],
            ].map(([k, v]) => (
              <div key={k} style={{ background: "var(--bg-elevated)", padding: "10px 12px", borderRadius: 8, textAlign: "center" }}>
                <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>{k}</div>
                <div style={{ fontWeight: 600, fontFamily: "JetBrains Mono, monospace", fontSize: "0.8rem" }}>{v}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-primary" onClick={downloadFrame}>🖼 Download Frame</button>
            {match.clip_url && (
              <button className="btn btn-secondary" onClick={downloadClip}>🎬 Download Clip</button>
            )}
            <button className="btn btn-ghost" onClick={onClose} style={{ marginLeft: "auto" }}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Results Page ─────────────────────────────────────────────────
export default function ResultsPage() {
  const [jobId, setJobId] = useState("");
  const [job, setJob] = useState<SearchJob | null>(null);
  const [loadingJob, setLoadingJob] = useState(false);
  const [videoPlayer, setVideoPlayer] = useState<MatchResult | null>(null);
  const [selectedTimeline, setSelectedTimeline] = useState<MatchResult | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportTitle, setExportTitle] = useState("VisionCCTV Investigation Report");
  const [exportInvestigator, setExportInvestigator] = useState("");
  const [filterLabel, setFilterLabel] = useState("");
  const [sortBy, setSortBy] = useState<"timestamp" | "confidence">("timestamp");
  const [view, setView] = useState<"grid" | "list">("grid");

  const loadJob = useCallback(async (id: string) => {
    if (!id.trim()) return;
    setLoadingJob(true);
    try {
      const j = await getJobStatus(id.trim());
      setJob(j);
    } catch {
      showToast("Job not found", "error");
      setJob(null);
    } finally {
      setLoadingJob(false);
    }
  }, []);

  // Auto-load from URL hash
  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash) { setJobId(hash); loadJob(hash); }
  }, [loadJob]);

  const matches: MatchResult[] = (job?.matches || [])
    .filter((m) => !filterLabel || m.label.toLowerCase().includes(filterLabel.toLowerCase()))
    .sort((a, b) => sortBy === "timestamp" ? a.timestamp - b.timestamp : b.confidence - a.confidence);

  const totalDuration = matches.length > 0 ? matches[matches.length - 1].timestamp + 10 : 60;

  const handleExport = async () => {
    if (!jobId) return;
    setExporting(true);
    try {
      const blob = await exportReport(jobId, exportTitle, exportInvestigator || "N/A");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `visioncctv_report_${jobId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("✓ Forensic PDF report downloaded", "success");
    } catch {
      showToast("Export failed — ensure the search is complete", "error");
    } finally {
      setExporting(false);
    }
  };

  const confidenceColor = (c: number) =>
    c >= 0.8 ? "var(--green)" : c >= 0.6 ? "var(--yellow)" : "var(--accent)";

  return (
    <ToastProvider>
      <AppLayout>
        <div className="page-header">
          <h1 className="page-title">🎯 Investigation Results</h1>
          <p className="page-subtitle">
            Timestamped evidence frames, video clips, suspect trail, and forensic export.
          </p>
        </div>

        {/* Job Loader */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="section-title">Load Search Job</div>
          <div style={{ display: "flex", gap: 10 }}>
            <input
              className="input-field"
              placeholder="Enter Job ID from the Search page…"
              value={jobId}
              onChange={(e) => setJobId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && loadJob(jobId)}
            />
            <button className="btn btn-secondary" onClick={() => loadJob(jobId)} disabled={loadingJob}>
              {loadingJob ? "⏳" : "Load"}
            </button>
            <a href="/search" className="btn btn-ghost">New Search →</a>
          </div>
        </div>

        {job && (
          <>
            {/* Status + Controls */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
              <span className={`status-pill status-${job.status}`}>{job.status}</span>
              {job.status === "completed" && (
                <span style={{ fontSize: "1rem", fontWeight: 800, color: "var(--green)" }}>
                  {job.match_count} match{job.match_count !== 1 ? "es" : ""} found
                </span>
              )}

              <div style={{ marginLeft: "auto", display: "flex", gap: 8, flexWrap: "wrap" }}>
                <input
                  className="input-field"
                  style={{ width: 150 }}
                  placeholder="Filter label…"
                  value={filterLabel}
                  onChange={(e) => setFilterLabel(e.target.value)}
                />
                <select className="input-field" style={{ width: 160 }} value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "timestamp" | "confidence")}>
                  <option value="timestamp">Sort: Time ↑</option>
                  <option value="confidence">Sort: Confidence ↓</option>
                </select>
                {/* View toggle */}
                <div style={{ display: "flex", background: "var(--bg-elevated)", borderRadius: 6, overflow: "hidden", border: "1px solid var(--border)" }}>
                  {(["grid", "list"] as const).map((v) => (
                    <button key={v} onClick={() => setView(v)} style={{
                      padding: "6px 12px", border: "none", cursor: "pointer",
                      background: view === v ? "var(--bg-card)" : "transparent",
                      color: view === v ? "var(--text-primary)" : "var(--text-muted)",
                      fontSize: "0.75rem", fontWeight: 600, fontFamily: "Inter, sans-serif",
                      transition: "all 0.15s",
                    }}>
                      {v === "grid" ? "⊞ Grid" : "≡ List"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Suspect Trail */}
            {job.status === "completed" && matches.length > 0 && (
              <SuspectTrail matches={matches} />
            )}

            {/* Timeline Scrubber */}
            {job.status === "completed" && matches.length > 0 && (
              <TimelineScrubber
                matches={matches}
                totalDuration={totalDuration}
                onSelect={(m) => { setSelectedTimeline(m); setVideoPlayer(m); }}
                selected={selectedTimeline}
              />
            )}

            {/* Export Panel */}
            {job.status === "completed" && job.match_count > 0 && (
              <div className="card" style={{
                marginBottom: 24,
                background: "linear-gradient(135deg, rgba(15,52,96,0.4), rgba(10,10,15,0.5))",
                borderColor: "rgba(0,212,255,0.2)",
              }}>
                <div className="section-title">📄 Export Forensic Report</div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
                  <div className="input-group" style={{ flex: 2, marginBottom: 0 }}>
                    <label className="input-label">Report Title</label>
                    <input className="input-field" value={exportTitle} onChange={(e) => setExportTitle(e.target.value)} />
                  </div>
                  <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                    <label className="input-label">Investigator</label>
                    <input className="input-field" placeholder="Optional" value={exportInvestigator} onChange={(e) => setExportInvestigator(e.target.value)} />
                  </div>
                  <button className="btn btn-primary" onClick={handleExport} disabled={exporting}>
                    {exporting ? "⏳ Generating…" : "📄 Export PDF"}
                  </button>
                </div>
              </div>
            )}

            {/* Results */}
            {matches.length === 0 && job.status === "completed" ? (
              <div className="empty-state">
                <div className="empty-state-icon">🔍</div>
                <div className="empty-state-title">No matches found</div>
                <div className="empty-state-sub">Try lowering the match threshold or a different search query</div>
              </div>
            ) : view === "grid" ? (
              <div className="results-grid" style={{ animationName: "fadeIn" }}>
                {matches.map((match, i) => (
                  <div
                    key={i}
                    className="result-card"
                    onClick={() => { setVideoPlayer(match); setSelectedTimeline(match); }}
                    style={{
                      borderColor: selectedTimeline === match ? "var(--cyan)" : "var(--border)",
                      boxShadow: selectedTimeline === match ? "0 0 20px rgba(0,212,255,0.15)" : "",
                    }}
                  >
                    {/* Thumbnail with play overlay */}
                    <div style={{ position: "relative" }}>
                      {match.frame_url ? (
                        <img
                          src={resolveStorageUrl(match.frame_url)}
                          alt={`Match at ${match.timestamp_str}`}
                          style={{ width: "100%", height: 160, objectFit: "cover" }}
                        />
                      ) : (
                        <div style={{ width: "100%", height: 160, background: "var(--bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem" }}>🎬</div>
                      )}
                      {/* Play button overlay */}
                      <div style={{
                        position: "absolute", inset: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: "rgba(0,0,0,0)",
                        transition: "background 0.2s",
                      }}
                        className="play-overlay"
                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.4)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0)")}
                      >
                        <div style={{
                          width: 44, height: 44, borderRadius: "50%",
                          background: "rgba(233,69,96,0.9)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "1.2rem", opacity: 0, transition: "opacity 0.2s",
                        }}
                          className="play-icon"
                        >▶</div>
                      </div>
                      {/* Confidence badge */}
                      <div style={{
                        position: "absolute", top: 8, right: 8,
                        padding: "3px 8px", borderRadius: 100,
                        background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)",
                        fontSize: "0.7rem", fontWeight: 700,
                        color: confidenceColor(match.confidence),
                        border: `1px solid ${confidenceColor(match.confidence)}44`,
                      }}>
                        {(match.confidence * 100).toFixed(0)}%
                      </div>
                      {/* Search type badge */}
                      <div style={{
                        position: "absolute", top: 8, left: 8,
                        padding: "3px 8px", borderRadius: 100,
                        background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)",
                        fontSize: "0.65rem", color: "var(--text-secondary)",
                      }}>
                        {match.search_type === "face_recognition" ? "👤" : "💬"}
                      </div>
                    </div>

                    <div className="result-card-body">
                      <div className="result-card-ts">{match.timestamp_str}</div>
                      <div className="result-card-meta">
                        <span className="badge badge-cyan">📹 {match.camera_id}</span>
                        {match.label && <span className="badge badge-accent">{match.label}</span>}
                      </div>
                      <div className="result-card-actions">
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={(e) => { e.stopPropagation(); setVideoPlayer(match); setSelectedTimeline(match); }}
                        >▶ Play</button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            const a = document.createElement("a");
                            a.href = resolveStorageUrl(match.frame_url);
                            a.download = `frame_${match.label}_${i}.jpg`;
                            a.target = "_blank"; a.click();
                          }}
                        >🖼</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* List view */
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {matches.map((match, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex", alignItems: "center", gap: 14,
                      padding: "12px 16px",
                      background: "var(--bg-card)", border: `1px solid ${selectedTimeline === match ? "var(--cyan)" : "var(--border)"}`,
                      borderRadius: "var(--radius-md)", cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                    onClick={() => { setVideoPlayer(match); setSelectedTimeline(match); }}
                  >
                    <div style={{ width: 80, height: 52, borderRadius: 6, overflow: "hidden", flexShrink: 0, background: "var(--bg-elevated)" }}>
                      {match.frame_url && (
                        <img src={resolveStorageUrl(match.frame_url)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.85rem", fontWeight: 600, marginBottom: 4 }}>{match.timestamp_str}</div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <span className="badge badge-cyan">📹 {match.camera_id}</span>
                        <span className="badge badge-accent">{match.label}</span>
                      </div>
                    </div>
                    <div style={{ color: confidenceColor(match.confidence), fontWeight: 800, fontSize: "1rem", flexShrink: 0 }}>
                      {(match.confidence * 100).toFixed(0)}%
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={(e) => { e.stopPropagation(); setVideoPlayer(match); }}>▶ Play</button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {!job && !loadingJob && (
          <div className="empty-state">
            <div className="empty-state-icon">🎯</div>
            <div className="empty-state-title">No results loaded</div>
            <div className="empty-state-sub">
              Enter a Job ID above, or{" "}
              <a href="/search" style={{ color: "var(--accent)" }}>run a new search →</a>
            </div>
          </div>
        )}

        {/* Inline Video Player Modal */}
        {videoPlayer && (
          <VideoPlayerModal
            match={videoPlayer}
            onClose={() => setVideoPlayer(null)}
          />
        )}

        <style>{`
          .result-card:hover .play-icon { opacity: 1 !important; }
        `}</style>
      </AppLayout>
    </ToastProvider>
  );
}
