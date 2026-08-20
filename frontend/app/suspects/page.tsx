"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import AppLayout from "@/components/AppLayout";
import ToastProvider, { showToast } from "@/components/ToastProvider";
import { listReferences, uploadReference, deleteReference, resolveStorageUrl, ReferenceMeta } from "@/lib/api";

export default function SuspectsPage() {
  const [refs, setRefs] = useState<ReferenceMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const [label, setLabel] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const loadRefs = useCallback(async () => {
    try {
      const data = await listReferences();
      setRefs(data.references);
    } catch (err: any) {
      showToast(err?.message || "Failed to load references", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRefs(); }, [loadRefs]);

  const handleFilePick = (file: File) => {
    setPendingFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
    setLabel(file.name.replace(/\.[^.]+$/, "").replace(/_/g, " "));
  };

  const handleUpload = async () => {
    if (!pendingFile) { showToast("Select a file first", "error"); return; }
    if (!label.trim()) { showToast("Enter a label/name", "error"); return; }
    setUploading(true);
    try {
      await uploadReference(pendingFile, label.trim());
      showToast(`✓ Reference "${label}" added`, "success");
      setPendingFile(null);
      setPreview(null);
      setLabel("");
      await loadRefs();
    } catch (err: any) {
      showToast(err?.message || "Upload failed", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (ref: ReferenceMeta) => {
    try {
      await deleteReference(ref.id);
      showToast(`Removed: ${ref.label}`, "info");
      setRefs((prev) => prev.filter((r) => r.id !== ref.id));
    } catch (err: any) {
      showToast(err?.message || "Delete failed", "error");
    }
  };


  return (
    <ToastProvider>
      <AppLayout>
        <div className="page-header">
          <h1 className="page-title">👤 Reference Images</h1>
          <p className="page-subtitle">
            Upload suspect photos, vehicle images, or any reference for face re-identification.
          </p>
        </div>

        <div className="grid-2" style={{ gap: 24, alignItems: "start" }}>
          {/* Upload Panel */}
          <div>
            <div className="section-title">Add New Reference</div>
            <div className="card">
              <div
                className={`drop-zone ${dragOver ? "drag-over" : ""}`}
                style={{ padding: "28px 20px", marginBottom: 16 }}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); e.dataTransfer.files[0] && handleFilePick(e.dataTransfer.files[0]); }}
                onClick={() => inputRef.current?.click()}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => e.target.files?.[0] && handleFilePick(e.target.files[0])}
                />
                {preview ? (
                  <img src={preview} alt="preview" style={{ maxHeight: 160, margin: "0 auto", borderRadius: 8, objectFit: "cover" }} />
                ) : (
                  <>
                    <div className="drop-zone-icon">🖼</div>
                    <div className="drop-zone-title">Drop suspect photo here</div>
                    <div className="drop-zone-sub">JPG, PNG, WebP · Max 10 MB</div>
                  </>
                )}
              </div>

              <div className="input-group">
                <label className="input-label">Name / Label</label>
                <input
                  className="input-field"
                  placeholder="e.g. Suspect A, Red Car"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                />
              </div>

              <button
                className="btn btn-primary"
                style={{ width: "100%" }}
                onClick={handleUpload}
                disabled={!pendingFile || uploading}
              >
                {uploading ? "Uploading…" : "⬆ Add Reference Image"}
              </button>
            </div>
          </div>

          {/* Reference List */}
          <div>
            <div className="section-title">
              Saved References ({refs.length})
            </div>

            {loading ? (
              <div className="empty-state">
                <div className="empty-state-icon pulse">⏳</div>
                <div className="empty-state-title">Loading…</div>
              </div>
            ) : refs.length === 0 ? (
              <div className="empty-state" style={{ padding: "40px 20px" }}>
                <div className="empty-state-icon">🖼</div>
                <div className="empty-state-title">No references yet</div>
                <div className="empty-state-sub">Add a suspect photo to get started</div>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12 }}>
                {refs.map((ref) => (
                  <div
                    key={ref.id}
                    className="card"
                    style={{ padding: 12, textAlign: "center", position: "relative" }}
                  >
                    <button
                      onClick={() => handleDelete(ref)}
                      style={{
                        position: "absolute", top: 6, right: 6,
                        background: "var(--accent-dim)", border: "none",
                        borderRadius: "50%", width: 22, height: 22,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "pointer", fontSize: "0.65rem", color: "var(--accent)",
                      }}
                      title="Remove"
                    >✕</button>
                    {ref.image_url ? (
                      <img
                        src={resolveStorageUrl(ref.image_url)}
                        alt={ref.label}
                        style={{
                          width: "100%", height: 100,
                          objectFit: "cover", borderRadius: 6, marginBottom: 8,
                        }}
                      />

                    ) : (
                      <div style={{
                        width: "100%", height: 100, background: "var(--bg-elevated)",
                        borderRadius: 6, marginBottom: 8, display: "flex",
                        alignItems: "center", justifyContent: "center", fontSize: "2rem",
                      }}>👤</div>
                    )}
                    <div style={{ fontSize: "0.8rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {ref.label}
                    </div>
                    <div className="mono" style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: 3 }}>
                      #{ref.id}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </AppLayout>
    </ToastProvider>
  );
}
