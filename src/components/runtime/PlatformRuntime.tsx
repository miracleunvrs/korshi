"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { CloudOff, RefreshCw, X } from "lucide-react";
import { flushPlatformQueue, getPendingPlatformMutations, syncPlatformMutation } from "@/lib/supabase/platformRepository";
import { useOperationsStore } from "@/stores/operationsStore";
import { useAppStore } from "@/stores/appStore";

export default function PlatformRuntime() {
  const pathname = usePathname();
  const isLoggedIn = useAppStore((state) => state.isLoggedIn);
  const hydrateFromBackend = useOperationsStore((state) => state.hydrateFromBackend);
  const [offline, setOffline] = useState(false);
  const [pending, setPending] = useState(0);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const sync = async () => {
      setOffline(!navigator.onLine);
      if (navigator.onLine) await flushPlatformQueue();
      setPending(getPendingPlatformMutations());
    };
    void sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => { window.removeEventListener("online", sync); window.removeEventListener("offline", sync); };
  }, []);

  useEffect(() => {
    if (isLoggedIn) void hydrateFromBackend();
  }, [hydrateFromBackend, isLoggedIn]);

  useEffect(() => {
    void syncPlatformMutation({ operation: "insert", table: "analytics_events", payload: { event_name: "page_view", session_id: window.sessionStorage.getItem("korshi-session") || "browser", properties: { path: pathname } } });
  }, [pathname]);

  if (hidden || (!offline && pending === 0)) return null;
  return <div className="fixed inset-x-3 bottom-24 z-50 mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-stone-900 p-3 text-white shadow-2xl md:bottom-5" role="status"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10">{offline ? <CloudOff className="h-4 w-4" /> : <RefreshCw className="h-4 w-4 animate-spin" />}</span><p className="min-w-0 flex-1 text-xs font-bold">{offline ? "Нет сети — действия сохраняются на устройстве" : `Синхронизация: осталось ${pending}`}</p><button onClick={() => setHidden(true)} aria-label="Скрыть"><X className="h-4 w-4" /></button></div>;
}
