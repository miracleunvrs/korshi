"use client";

import { X } from "lucide-react";
import { useAppStore } from "@/stores/appStore";

export default function BackendErrorBanner() {
  const backendError = useAppStore((state) => state.backendError);
  const clearBackendError = useAppStore((state) => state.clearBackendError);

  if (!backendError) return null;

  return (
    <div
      className="fixed left-4 right-4 top-4 z-[100] mx-auto flex max-w-xl items-start justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 p-3 text-xs text-red-800 shadow-lg"
      role="alert"
      aria-live="assertive"
    >
      <span className="break-words">{backendError}</span>
      <button type="button" onClick={clearBackendError} aria-label="Закрыть уведомление">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
