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

    let refreshTimer: number | undefined;
    let authChangeTimer: number | undefined;
    const refresh = () => {
      window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(() => {
        void hydrateDomainData().catch(() => undefined);
      }, 150);
    };

    void syncAuthState().then(() => {
      if (useAppStore.getState().isLoggedIn) return hydrateDomainData();
    }).catch(() => {
      // Middleware и экран входа обработают отсутствие/ошибку сессии.
    });

    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "INITIAL_SESSION") return;
      // Выносим запрос профиля из callback Supabase, чтобы не блокировать auth-lock.
      authChangeTimer = window.setTimeout(() => {
        void syncAuthState().then(() => {
          if (useAppStore.getState().isLoggedIn) return hydrateDomainData();
        }).catch(() => undefined);
      }, 0);
    });

    const realtime = supabase
      .channel("housesm-domain-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "poll_votes" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "comments" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "reactions" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "chats" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "classifieds" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "service_requests" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "service_request_events" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "house_documents" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "house_document_acknowledgements" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "official_votes" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "official_vote_ballots" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "finance_transactions" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "emergency_alerts" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "home_schedule_items" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "amenity_bookings" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "visitor_passes" }, refresh)
      .subscribe();

    return () => {
      window.clearTimeout(refreshTimer);
      window.clearTimeout(authChangeTimer);
      subscription.unsubscribe();
      void supabase.removeChannel(realtime);
    };
  }, [hydrateDomainData, syncAuthState]);

  return null;
}
