"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Bell,
  Building2,
  CheckCheck,
  ChevronRight,
  FileText,
  MessageSquareText,
  Settings2,
  ShieldAlert,
  Vote,
  Wrench,
} from "lucide-react";
import { useAppStore, type AppNotification, type NotificationPreferenceKey } from "@/stores/appStore";
import { useOperationsStore } from "@/stores/operationsStore";

const preferenceRows: Array<{ key: NotificationPreferenceKey; title: string; description: string }> = [
  { key: "requests", title: "Заявки", description: "Комментарии, исполнители и статусы" },
  { key: "community", title: "Сообщество", description: "Объявления, чаты и голосования" },
  { key: "finance", title: "Финансы", description: "Счета, сборы и новые отчёты" },
  { key: "emergency", title: "Аварийные события", description: "Критичные сообщения дома" },
];

function notificationMeta(notification: AppNotification) {
  if (notification.type === "service_request") return { icon: Wrench, tone: "bg-green-100 text-green-800", href: "/requests" };
  if (notification.type === "message" || notification.type === "comment") return { icon: MessageSquareText, tone: "bg-sky-100 text-sky-800", href: typeof notification.data?.chat_id === "string" ? `/chats/${notification.data.chat_id}` : "/chats" };
  if (notification.type === "vote") return { icon: Vote, tone: "bg-amber-100 text-amber-900", href: typeof notification.data?.post_id === "string" ? `/feed/${notification.data.post_id}` : "/hoa" };
  if (notification.type === "document") return { icon: FileText, tone: "bg-violet-100 text-violet-800", href: "/documents" };
  if (notification.type === "emergency") return { icon: ShieldAlert, tone: "bg-rose-100 text-rose-800", href: "/feed" };
  return { icon: Building2, tone: "bg-stone-100 text-stone-700", href: "/feed" };
}

export default function NotificationsPage() {
  const notifications = useAppStore((state) => state.notifications);
  const markRead = useAppStore((state) => state.markNotificationRead);
  const markAllRead = useAppStore((state) => state.markAllNotificationsRead);
  const preferences = useAppStore((state) => state.notificationPreferences);
  const setPreference = useAppStore((state) => state.setNotificationPreference);
  const channels = useOperationsStore((state) => state.notificationChannels);
  const setChannel = useOperationsStore((state) => state.setNotificationChannel);
  const [tab, setTab] = useState<"all" | "unread" | "settings">("all");
  const [error, setError] = useState("");
  const unreadCount = notifications.filter((item) => !item.isRead).length;
  const visible = useMemo(() => tab === "unread" ? notifications.filter((item) => !item.isRead) : notifications, [notifications, tab]);

  const markAll = async () => {
    setError("");
    try {
      await markAllRead();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не удалось обновить уведомления");
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f7f2]">
      <header className="border-b border-stone-200/80 px-4 py-5 sm:px-6 sm:py-7">
        <div className="flex items-start justify-between gap-4">
          <div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-green-800">Центр событий</p><h1 className="mt-1 text-2xl font-black tracking-[-0.035em] text-stone-950 sm:text-3xl">Уведомления</h1><p className="mt-1 text-sm leading-6 text-stone-600">Только важные изменения по вашему дому.</p></div>
          {unreadCount > 0 && <button type="button" onClick={() => void markAll()} className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-white px-3 text-xs font-extrabold text-green-800 shadow-sm ring-1 ring-stone-200 hover:bg-green-50"><CheckCheck className="h-4 w-4" />Прочитать все</button>}
        </div>
        <div className="mt-5 flex gap-1 rounded-2xl bg-stone-200/65 p-1" role="tablist" aria-label="Раздел уведомлений">
          {([["all", "Все"], ["unread", `Новые · ${unreadCount}`], ["settings", "Настройки"]] as const).map(([id, label]) => <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`min-h-10 flex-1 rounded-xl px-2 text-xs font-extrabold transition ${tab === id ? "bg-white text-stone-950 shadow-sm" : "text-stone-500 hover:text-stone-800"}`}>{label}</button>)}
        </div>
      </header>

      {error && <p role="alert" className="mx-4 mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800 sm:mx-6">{error}</p>}

      <section className="px-4 py-5 sm:px-6">
        {tab === "settings" ? <section className="overflow-hidden rounded-[24px] border border-stone-200 bg-white" aria-labelledby="notification-settings-title">
          <div className="border-b border-stone-100 p-5"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-100 text-violet-800"><Settings2 className="h-5 w-5" /></span><div><h2 id="notification-settings-title" className="font-extrabold text-stone-950">Какие события показывать</h2><p className="text-xs leading-5 text-stone-500">Аварийные уведомления рекомендуется оставить включёнными.</p></div></div></div>
          <div className="divide-y divide-stone-100">{preferenceRows.map((row) => <label key={row.key} className="flex min-h-[76px] cursor-pointer items-center justify-between gap-4 px-5 py-3 hover:bg-stone-50"><span><span className="block text-sm font-extrabold text-stone-900">{row.title}</span><span className="block text-xs leading-5 text-stone-500">{row.description}</span></span><Switch checked={preferences[row.key]} onChange={(enabled) => setPreference(row.key, enabled)} /></label>)}</div>
          <div className="border-t border-stone-100 bg-stone-50/70 p-5"><h3 className="text-xs font-extrabold uppercase tracking-[.12em] text-stone-500">Каналы доставки</h3><div className="mt-3 space-y-3">{([
            ["push", "Push для Web и Flutter", "Активируется после настройки OneSignal/FCM"],
            ["voting", "Напоминания о голосованиях", "До завершения официального голосования"],
            ["payments", "Напоминания о платежах", "Счета и задолженность только владельцу"],
            ["emailCritical", "Email для критичных событий", "Нужен SMTP/API-провайдер"],
            ["smsCritical", "SMS для критичных событий", "Нужен SMS-провайдер"],
          ] as const).map(([key, title, description]) => <label key={key} className="flex min-h-14 cursor-pointer items-center justify-between gap-4 rounded-2xl bg-white px-4 py-3 ring-1 ring-stone-200"><span><span className="block text-xs font-extrabold text-stone-900">{title}</span><span className="mt-0.5 block text-[10px] leading-4 text-stone-500">{description}</span></span><Switch checked={channels[key]} onChange={(enabled) => void setChannel(key, enabled)} /></label>)}</div><p className="mt-3 text-[10px] leading-4 text-stone-500">Настройки сохраняются локально и в Supabase после применения миграций. Без ключей внешних провайдеров email/SMS/push не отправляются.</p></div>
        </section> : visible.length === 0 ? <div className="rounded-[24px] border border-dashed border-stone-300 bg-white px-6 py-16 text-center"><Bell className="mx-auto h-9 w-9 text-stone-300" /><h2 className="mt-4 font-extrabold text-stone-900">Новых уведомлений нет</h2><p className="mt-1 text-sm text-stone-500">Всё важное уже просмотрено.</p></div> : <div className="space-y-2">{visible.map((notification, index) => {
          const meta = notificationMeta(notification);
          const Icon = meta.icon;
          return <Link key={notification.id} href={meta.href} onClick={() => void markRead(notification.id).catch(() => undefined)} className={`reveal-up flex min-h-[88px] items-start gap-3 rounded-[22px] border p-4 transition hover:-translate-y-0.5 hover:border-stone-300 ${notification.isRead ? "border-stone-200 bg-white/70" : "border-green-200 bg-white shadow-[0_10px_30px_rgba(22,101,52,.07)]"}`} style={{ animationDelay: `${index * 45}ms` }}>
            <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${meta.tone}`}><Icon className="h-5 w-5" aria-hidden="true" /></span><span className="min-w-0 flex-1"><span className="flex items-start justify-between gap-3"><span className="text-sm font-extrabold text-stone-950">{notification.title}</span><span className="shrink-0 text-[10px] font-semibold text-stone-400">{notification.createdAt}</span></span><span className="mt-1 block text-xs leading-5 text-stone-600">{notification.body}</span></span><ChevronRight className="mt-3 h-4 w-4 shrink-0 text-stone-300" aria-hidden="true" />
          </Link>;
        })}</div>}
      </section>
    </div>
  );
}

function Switch({ checked, onChange }: { checked: boolean; onChange: (value: boolean) => void }) {
  return <span className={`relative h-7 w-12 shrink-0 rounded-full transition ${checked ? "bg-green-700" : "bg-stone-300"}`}><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="sr-only" /><span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} /></span>;
}
