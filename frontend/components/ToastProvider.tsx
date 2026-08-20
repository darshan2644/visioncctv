"use client";

import { useEffect, useCallback, ReactNode } from "react";

interface Toast {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

// Global toast state (simple pattern, avoids heavy state libraries)
type ToastHandler = (message: string, type?: Toast["type"]) => void;

let _showToast: ToastHandler = () => {};

export function showToast(message: string, type: Toast["type"] = "info") {
  _showToast(message, type);
}

import { useState } from "react";

export default function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast: ToastHandler = useCallback((message, type = "info") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  useEffect(() => {
    _showToast = addToast;
  }, [addToast]);

  const icons = { success: "✓", error: "✕", info: "ℹ" };

  return (
    <>
      {children}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <span>{icons[t.type]}</span>
            {t.message}
          </div>
        ))}
      </div>
    </>
  );
}
