import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type PlatformMutation = {
  id: string;
  operation: "insert" | "upsert" | "update" | "delete" | "rpc";
  table: string;
  recordId?: string;
  match?: Record<string, unknown>;
  payload?: Record<string, unknown>;
  createdAt: string;
  attempts: number;
};

const QUEUE_KEY = "korshi-platform-sync-queue-v1";

function readQueue(): PlatformMutation[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(QUEUE_KEY) || "[]") as PlatformMutation[];
  } catch {
    return [];
  }
}

function writeQueue(queue: PlatformMutation[]) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(QUEUE_KEY, JSON.stringify(queue.slice(-100)));
  }
}

export function getPendingPlatformMutations() {
  return readQueue().length;
}

async function executeMutation(mutation: PlatformMutation) {
  const supabase = createClient() as any;
  if (mutation.operation === "rpc") {
    const { error } = await supabase.rpc(mutation.table, mutation.payload || {});
    if (error) throw error;
    return;
  }
  if (mutation.operation === "insert" || mutation.operation === "upsert") {
    const builder = supabase.from(mutation.table);
    const { error } = mutation.operation === "upsert"
      ? await builder.upsert(mutation.payload || {})
      : await builder.insert(mutation.payload || {});
    if (error) throw error;
    return;
  }

  if (!mutation.recordId && !mutation.match) throw new Error("Для изменения записи нужен идентификатор");
  const query = supabase.from(mutation.table);
  let builder = mutation.operation === "delete" ? query.delete() : query.update(mutation.payload || {});
  if (mutation.recordId) builder = builder.eq("id", mutation.recordId);
  for (const [column, value] of Object.entries(mutation.match || {})) builder = builder.eq(column, value);
  const { error } = await builder;
  if (error) throw error;
}

export async function loadPlatformSnapshot() {
  if (!isSupabaseConfigured()) return null;
  const supabase = createClient() as any;
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) return null;

  const queries = await Promise.all([
    supabase.from("complex_memberships").select("*, complex:complexes(name,address), apartment:apartments(number, entrance:entrances(number, building:buildings(number)))").order("created_at"),
    supabase.from("access_passes").select("*").order("created_at", { ascending: false }),
    supabase.from("access_events").select("*").order("occurred_at", { ascending: false }).limit(100),
    supabase.from("parking_spots").select("*").order("label"),
    supabase.from("parking_bookings").select("*").order("starts_at", { ascending: false }),
    supabase.from("work_orders").select("*, checklist:work_order_checklist_items(*), attachments:work_order_attachments(*)").order("starts_at", { ascending: false }),
    supabase.from("community_events").select("*, rsvps:community_event_rsvps(user_id,choice), albums:community_event_albums(id)").order("starts_at"),
    supabase.from("community_clubs").select("*, members:community_club_members(user_id)").order("name"),
    supabase.from("community_notices").select("*").order("created_at", { ascending: false }),
    supabase.from("marketplace_favorites").select("classified_id"),
    supabase.from("marketplace_reviews").select("*, author:profiles(full_name)").order("created_at", { ascending: false }),
    supabase.from("complex_settings").select("*").maybeSingle(),
    supabase.from("notification_preferences").select("*").maybeSingle(),
  ]);

  const data = (index: number) => queries[index].error ? undefined : queries[index].data;
  return {
    userId: authData.user.id as string,
    memberships: data(0), passes: data(1), accessEvents: data(2), parkingSpots: data(3),
    parkingBookings: data(4), works: data(5), events: data(6), clubs: data(7), notices: data(8),
    favorites: data(9), reviews: data(10), complexSettings: data(11), notificationPreferences: data(12),
  };
}

export async function syncPlatformMutation(
  mutation: Omit<PlatformMutation, "id" | "createdAt" | "attempts">,
) {
  if (!isSupabaseConfigured()) return { queued: false, demo: true };

  const queuedMutation: PlatformMutation = {
    ...mutation,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    attempts: 0,
  };

  if (typeof navigator !== "undefined" && !navigator.onLine) {
    writeQueue([...readQueue(), queuedMutation]);
    return { queued: true, demo: false };
  }

  try {
    await executeMutation(queuedMutation);
    return { queued: false, demo: false };
  } catch {
    writeQueue([...readQueue(), queuedMutation]);
    return { queued: true, demo: false };
  }
}

export async function flushPlatformQueue() {
  if (!isSupabaseConfigured() || (typeof navigator !== "undefined" && !navigator.onLine)) {
    return { synced: 0, pending: readQueue().length };
  }

  const pending = readQueue();
  const failed: PlatformMutation[] = [];
  let synced = 0;
  for (const mutation of pending) {
    try {
      await executeMutation(mutation);
      synced += 1;
    } catch {
      failed.push({ ...mutation, attempts: mutation.attempts + 1 });
    }
  }
  writeQueue(failed);
  return { synced, pending: failed.length };
}
