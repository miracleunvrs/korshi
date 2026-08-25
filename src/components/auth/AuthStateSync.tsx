"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { useAppStore } from "@/stores/appStore";

export default function AuthStateSync() {
  const syncAuthState = useAppStore((state) => state.syncAuthState);
  const hydrateDomainData = useAppStore((state) => state.hydrateDomainData);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    void syncAuthState().then(() => {
      if (useAppStore.getState().isLoggedIn) return hydrateDomainData();
    }).catch(() => {
      // Middleware и экран входа обработают отсутствие/ошибку сессии.
    });

    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      // Выносим запрос профиля из callback Supabase, чтобы не блокировать auth-lock.
      window.setTimeout(() => {
        void syncAuthState().then(() => {
          if (useAppStore.getState().isLoggedIn) return hydrateDomainData();
        }).catch(() => undefined);
      }, 0);
    });

    return () => subscription.unsubscribe();
  }, [hydrateDomainData, syncAuthState]);

  return null;
}
