"use client";

import { useState } from "react";

declare global {
  interface Window {
    OneSignalDeferred?: Array<(oneSignal: {
      login?: (externalId: string) => Promise<void>;
      logout?: () => Promise<void>;
      init?: (options: Record<string, unknown>) => Promise<void>;
      User?: { PushSubscription?: { optIn?: () => Promise<void> | void; optedIn?: boolean } };
      Notifications?: { requestPermission?: () => Promise<void> | void };
    }) => void | Promise<void>>;
  }
}

export default function PushPermissionButton() {
  const [loading, setLoading] = useState(false);
  const [enabled, setEnabled] = useState(false);

  const enablePush = () => {
    if (!process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || typeof window === "undefined") return;
    setLoading(true);
    const queue = (window.OneSignalDeferred = window.OneSignalDeferred || []);
    queue.push(async (oneSignal) => {
      try {
        await oneSignal.User?.PushSubscription?.optIn?.();
        await oneSignal.Notifications?.requestPermission?.();
        setEnabled(true);
      } finally {
        setLoading(false);
      }
    });
  };

  if (!process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID) {
    return <span className="text-[10px] text-gray-400">OneSignal не настроен</span>;
  }

  return (
    <button
      type="button"
      onClick={enablePush}
      disabled={loading || enabled}
      className="rounded-lg bg-green-100 px-2.5 py-1.5 text-[10px] font-bold text-green-700 disabled:opacity-60"
    >
      {loading ? "Подключение…" : enabled ? "Push включён" : "Включить push"}
    </button>
  );
}
