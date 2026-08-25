"use client";

import { useEffect, useRef } from "react";
import { useAppStore } from "@/stores/appStore";

type OneSignalInstance = {
  login?: (externalId: string) => Promise<void>;
  logout?: () => Promise<void>;
  init?: (options: Record<string, unknown>) => Promise<void>;
  User?: { PushSubscription?: { optIn?: () => Promise<void> | void; optedIn?: boolean } };
  Notifications?: { requestPermission?: () => Promise<void> | void };
};

declare global {
  interface Window {
    OneSignalDeferred?: Array<(oneSignal: OneSignalInstance) => void | Promise<void>>;
  }
}

const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;

export default function OneSignalProvider() {
  const userId = useAppStore((state) => state.supabaseUserId);
  const instanceRef = useRef<OneSignalInstance | null>(null);

  useEffect(() => {
    if (!appId || typeof window === "undefined") return;

    if (instanceRef.current) {
      if (userId) void instanceRef.current.login?.(userId);
      else void instanceRef.current.logout?.();
      return;
    }

    const queue = (window.OneSignalDeferred = window.OneSignalDeferred || []);
    const scriptId = "onesignal-web-sdk";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
      script.defer = true;
      document.head.appendChild(script);
    }

    queue.push(async (oneSignal) => {
      instanceRef.current = oneSignal;
      if (oneSignal.init) {
        await oneSignal.init({
          appId,
          serviceWorkerPath: "/OneSignalSDKWorker.js",
          allowLocalhostAsSecureOrigin: true,
        });
      }
      if (userId && oneSignal.login) await oneSignal.login(userId);
    });
  }, [userId]);

  return null;
}
