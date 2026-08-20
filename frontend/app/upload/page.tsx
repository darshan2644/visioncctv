"use client";

import { useState, useCallback, useRef } from "react";
import AppLayout from "@/components/AppLayout";
import ToastProvider from "@/components/ToastProvider";
import { showToast } from "@/components/ToastProvider";
import { uploadVideo, VideoMeta } from "@/lib/api";

interface UploadItem {
  file: File;
  cameraId: string;
  status: "pending" | "uploading" | "done" | "error";
  progress: number;
  result?: VideoMeta;
  error?: string;
}

export default function UploadPage() {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((files: File[]) => {
    const valid = files.filter((f) =>
      [".mp4", ".avi", ".mov", ".mkv", ".wmv"].some((ext) =>
        f.name.toLowerCase().endsWith(ext)
      )
    );
    if (valid.length < files.length) {
      showToast("Some files were skipped (unsupported format)", "error");
    }
    setItems((prev) => [
      ...prev,
      ...valid.map((f, i) => ({
        file: f,
        cameraId: `CAM-${String(prev.length + i + 1).padStart(2, "0")}`,
        status: "pending" as const,
        progress: 0,
      })),
    ]);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      addFiles(Array.from(e.dataTransfer.files));
    },
    [addFiles]
  );

  const updateItem = (index: number, patch: Partial<UploadItem>) =>
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));

  const handleUploadAll = async () => {
    const pending = items.filter((it) => it.status === "pending");
    if (!pending.length) { showToast("No pending files to upload", "info"); return; }

    for (let i = 0; i < items.length; i++) {
      if (items[i].status !== "pending") continue;
      updateItem(i, { status: "uploading", progress: 30 });
      try {
        const result = await uploadVideo(items[i].file, items[i].cameraId);
        updateItem(i, { status: "done", progress: 100, result: result.video });
        showToast(`✓ ${items[i].file.name} uploaded`, "success");
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Upload failed";
        updateItem(i, { status: "error", progress: 0, error: msg });
        showToast(msg || `Failed: ${items[i].file.name}`, "error");
      }
    }
  };

  const removeItem = (index: number) =>
    setItems((prev) => prev.filter((_, i) => i !== index));

  const pendingCount = items.filter((i) => i.status === "pending").length;

  return (
    <ToastProvider>
      <AppLayout>
        <div className="page-header">
          <h1 className="page-title">⬆ Upload CCTV Footage</h1>
          <p className="page-subtitle">
            Drag and drop video files. Assign camera IDs before uploading.
          </p>
        </div>

        {/* Drop Zone */}
        <div
          className={`drop-zone ${dragOver ? "drag-over" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          style={{ marginBottom: 24 }}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".mp4,.avi,.mov,.mkv,.wmv"
            style={{ display: "none" }}
            onChange={(e) => e.target.files && addFiles(Array.from(e.target.files))}
          />
          <div className="drop-zone-icon">🎬</div>
          <div className="drop-zone-title">
            {dragOver ? "Drop to add files" : "Drop CCTV videos here or click to browse"}
          </div>
          <div className="drop-zone-sub">Supports .mp4 .avi .mov .mkv .wmv — Batch upload supported</div>
        </div>

        {/* File Queue */}
        {items.length > 0 && (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div className="section-title" style={{ marginBottom: 0 }}>
                Upload Queue ({items.length} file{items.length !== 1 ? "s" : ""})
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setItems([])}>Clear All</button>
                <button
                  className="btn btn-primary"
                  onClick={handleUploadAll}
                  disabled={pendingCount === 0}
                >
                  ⬆ Upload {pendingCount > 0 ? `${pendingCount} File${pendingCount !== 1 ? "s" : ""}` : ""}
                </button>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {items.map((item, i) => (
                <div
                  key={i}
                  className="card"
                  style={{
                    display: "flex",
                    gap: 16,
                    alignItems: "center",
                    padding: "14px 18px",
                    borderColor:
                      item.status === "done" ? "rgba(0,255,136,0.3)" :
                      item.status === "error" ? "rgba(233,69,96,0.3)" : "var(--border)",
                  }}
                >
                  {/* Icon */}
                  <div style={{
                    width: 48, height: 48, flexShrink: 0,
                    background: "var(--bg-elevated)", borderRadius: 8,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "1.5rem",
                  }}>
                    {item.status === "done" ? "✅" : item.status === "error" ? "❌" : item.status === "uploading" ? "⏳" : "🎬"}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: "0.875rem", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.file.name}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: 6 }}>
                      {(item.file.size / 1024 / 1024).toFixed(1)} MB
                    </div>
                    {item.status === "uploading" && (
                      <div className="progress-bar">
                        <div className="progress-bar-fill pulse" style={{ width: "60%" }} />
                      </div>
                    )}
                    {item.status === "error" && (
                      <div style={{ fontSize: "0.75rem", color: "var(--accent)" }}>{item.error}</div>
                    )}
                    {item.status === "done" && (
                      <div style={{ fontSize: "0.75rem", color: "var(--green)" }}>
                        ✓ Uploaded · ID: <span className="mono">{item.result?.id}</span>
                      </div>
                    )}
                  </div>

                  {/* Camera ID */}
                  <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", gap: 4 }}>
                    <label className="input-label" style={{ marginBottom: 0 }}>Camera ID</label>
                    <input
                      className="input-field"
                      style={{ width: 120 }}
                      value={item.cameraId}
                      disabled={item.status !== "pending"}
                      onChange={(e) => updateItem(i, { cameraId: e.target.value })}
                      placeholder="CAM-01"
                    />
                  </div>

                  {/* Remove */}
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => removeItem(i)}
                    style={{ color: "var(--text-muted)", flexShrink: 0 }}
                    title="Remove"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {items.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">🎬</div>
            <div className="empty-state-title">No files queued</div>
            <div className="empty-state-sub">Drop video files above to get started</div>
          </div>
        )}
      </AppLayout>
    </ToastProvider>
  );
}
