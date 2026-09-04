"use client";

import { useState } from "react";
import Link from "next/link";
import NextImage from "next/image";
import { 
  ShieldCheck, 
  Users, 
  FileCheck, 
  AlertTriangle, 
  Check, 
  X, 
  Building2, 
  Eye, 
  Search,
  Bell,
  Sparkles,
  ChevronRight,
  ClipboardList,
  Clock3,
  Star,
  TrendingUp,
  Vote,
  WalletCards,
  Send,
  Download,
  Settings2,
  Shield,
} from "lucide-react";
import { useAppStore } from "@/stores/appStore";
import { useOperationsStore } from "@/stores/operationsStore";
import { syncPlatformMutation } from "@/lib/supabase/platformRepository";

export default function AdminPage() {
  const { 
    verificationRequests, 
    approveVerification, 
    rejectVerification, 
    urgentAlert, 
    setUrgentAlert,
    currentUser,
    serviceRequests,
    officialVotes,
    documents,
    finance,
    registeredUsers,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<"requests" | "residents" | "alert" | "stats">("stats");
  const [selectedDocImage, setSelectedDocImage] = useState<string | null>(null);
  const [broadcastStatus, setBroadcastStatus] = useState("");
  const marketplace = useOperationsStore((state) => state.marketplace);
  const accessEvents = useOperationsStore((state) => state.accessEvents);
  const works = useOperationsStore((state) => state.works);

  // Urgent alert form
  const [alertTitle, setAlertTitle] = useState(urgentAlert?.title || "");
  const [alertMessage, setAlertMessage] = useState(urgentAlert?.message || "");

  if (currentUser.role !== "admin" && currentUser.role !== "hoa_official") {
    return (
      <div className="min-h-screen bg-white p-8 flex flex-col items-center justify-center text-center gap-4">
        <ShieldCheck className="w-10 h-10 text-gray-300" />
        <p className="text-sm font-semibold text-gray-600">Доступ только для администратора</p>
        <Link href="/feed" className="text-sm font-bold text-green-700">Вернуться в ленту</Link>
      </div>
    );
  }

  const handleSaveAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertTitle.trim()) return;

    setUrgentAlert({
      id: `alert-${Date.now()}`,
      title: alertTitle.trim(),
      message: alertMessage.trim(),
      affectedAreas: [],
      active: true,
      acknowledged: false,
      createdAt: "Только что",
    });
  };

  const handleDisableAlert = () => {
    setUrgentAlert(null);
    setAlertTitle("");
    setAlertMessage("");
  };

  const pendingRequests = verificationRequests.filter((r) => r.status === "pending");
  const activeServiceRequests = serviceRequests.filter((request) => request.status === "submitted" || request.status === "in_progress");
  const ratedRequests = serviceRequests.filter((request) => request.rating);
  const averageRating = ratedRequests.length
    ? ratedRequests.reduce((sum, request) => sum + (request.rating || 0), 0) / ratedRequests.length
    : 0;
  const overdueRequests = activeServiceRequests.filter((request) => request.priority === "emergency" || request.events.some((event) => event.kind === "reopened"));

  const sendBroadcast = async () => {
    const text = window.prompt("Текст массового уведомления для жителей ЖК");
    if (!text?.trim()) return;
    const result = await syncPlatformMutation({ operation: "insert", table: "notification_broadcasts", payload: { title: "Сообщение ОСИ", body: text.trim(), channels: ["in_app", "push"] } });
    setBroadcastStatus(result.queued ? "Рассылка сохранена в очереди синхронизации" : "Рассылка поставлена в очередь доставки");
  };

  const exportAdminReport = () => {
    const rows = [["Показатель", "Значение"], ["Открытые заявки", String(activeServiceRequests.length)], ["Просроченные", String(overdueRequests.length)], ["Средняя оценка", averageRating.toFixed(1)], ["Жители", String(registeredUsers.length)], ["Жалобы маркетплейса", String(marketplace.reports.length)], ["События доступа", String(accessEvents.length)]];
    const blob = new Blob(["\uFEFF" + rows.map((row) => row.join(";")).join("\n")], { type: "text/csv;charset=utf-8" }); const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = "korshi-admin-report.csv"; anchor.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-white pb-12">
      {/* Шапка админки */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-gray-100 px-6 py-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-zinc-900 text-white flex items-center justify-center shadow-md">
              <ShieldCheck className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <h1 className="font-extrabold text-gray-900 text-lg">Панель управления ЖК</h1>
              <p className="text-xs text-gray-500 font-medium">Администрирование и верификация жильцов</p>
            </div>
          </div>

          <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full border border-green-200">
            Администратор ЖК
          </span>
        </div>

        {/* Вкладки админки */}
        <div className="flex gap-2 border-b border-gray-100 pb-1">
          {[
            { id: "stats", label: "Обзор" },
            { id: "requests", label: "Заявки на верификацию", badge: pendingRequests.length },
            { id: "residents", label: "Реестр жильцов" },
            { id: "alert", label: "Экстренное оповещение" },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
                  isActive
                    ? "bg-zinc-900 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="px-2 py-0.2 bg-green-600 text-white text-[10px] font-black rounded-full">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Контент активной вкладки */}
      <div className="p-6">
        {activeTab === "stats" && (
          <div className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: "Активные заявки", value: activeServiceRequests.length, detail: `${serviceRequests.filter((request) => request.status === "submitted").length} новых`, icon: ClipboardList, tone: "bg-green-100 text-green-800" },
                { label: "Оценка сервиса", value: averageRating ? averageRating.toFixed(1) : "—", detail: `${ratedRequests.length} оценок`, icon: Star, tone: "bg-amber-100 text-amber-900" },
                { label: "Активные голосования", value: officialVotes.filter((vote) => vote.status === "active").length, detail: "контроль кворума", icon: Vote, tone: "bg-violet-100 text-violet-800" },
                { label: "Баланс ОСИ", value: `${Math.round(finance.balance / 1000).toLocaleString("ru-RU")} тыс. ₸`, detail: "по журналу операций", icon: WalletCards, tone: "bg-sky-100 text-sky-800" },
              ].map((item) => <div key={item.label} className="rounded-[22px] border border-stone-200 bg-white p-4 shadow-sm"><span className={`grid h-10 w-10 place-items-center rounded-xl ${item.tone}`}><item.icon className="h-5 w-5" /></span><p className="mt-4 text-2xl font-black tracking-tight text-stone-950">{item.value}</p><p className="mt-1 text-xs font-extrabold text-stone-700">{item.label}</p><p className="text-[11px] text-stone-400">{item.detail}</p></div>)}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[
              ["Среднее время ответа", "42 мин", "за 30 дней"],
              ["Просроченные заявки", String(overdueRequests.length), "SLA и повторно открытые"],
              ["Активность жителей", `${Math.min(100, Math.round(registeredUsers.filter((user) => user.verified).length / Math.max(1, registeredUsers.length) * 100))}%`, "подтверждённые аккаунты"],
              ["Пропущенные работы", String(works.filter((work) => work.status === "missed").length), "требуют переноса"],
            ].map(([label, value, detail]) => <article key={label} className="rounded-[22px] border border-stone-200 bg-stone-50 p-4"><p className="text-xl font-black text-stone-950">{value}</p><p className="mt-1 text-xs font-extrabold text-stone-800">{label}</p><p className="mt-1 text-[10px] text-stone-500">{detail}</p></article>)}</div>

            <div className="grid gap-4 xl:grid-cols-2">
              <section className="rounded-[24px] border border-stone-200 bg-white p-5"><div className="flex items-center justify-between"><div><h2 className="text-sm font-extrabold text-stone-950">Очередь обслуживания</h2><p className="text-xs text-stone-500">Заявки, требующие внимания</p></div><Link href="/requests" className="text-xs font-extrabold text-green-800">Открыть все</Link></div><div className="mt-4 space-y-2">{activeServiceRequests.slice(0, 4).map((request) => <Link key={request.id} href="/requests" className="flex min-h-16 items-center gap-3 rounded-2xl bg-stone-50 p-3 transition hover:bg-stone-100"><span className={`h-2.5 w-2.5 shrink-0 rounded-full ${request.priority === "emergency" ? "bg-rose-500" : request.status === "submitted" ? "bg-sky-500" : "bg-amber-500"}`} /><span className="min-w-0 flex-1"><span className="block truncate text-xs font-extrabold text-stone-900">{request.title}</span><span className="block truncate text-[11px] text-stone-500">{request.location}</span></span>{request.slaDueAt && <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800"><Clock3 className="h-3 w-3" />{request.slaDueAt}</span>}</Link>)}</div></section>

              <section className="rounded-[24px] border border-stone-200 bg-white p-5"><div className="flex items-center justify-between"><div><h2 className="text-sm font-extrabold text-stone-950">Состояние дома</h2><p className="text-xs text-stone-500">Контент и участие жителей</p></div><TrendingUp className="h-5 w-5 text-green-700" /></div><dl className="mt-4 divide-y divide-stone-100">{[
                ["Подтверждённые жители", registeredUsers.filter((user) => user.verified).length],
                ["Документы в архиве", documents.filter((document) => document.status === "active").length],
                ["Требуют ознакомления", documents.filter((document) => document.requiresAcknowledgement && !document.acknowledged).length],
                ["Завершённые заявки", serviceRequests.filter((request) => request.status === "resolved" || request.status === "closed").length],
              ].map(([label, value]) => <div key={label} className="flex min-h-12 items-center justify-between text-xs"><dt className="font-semibold text-stone-600">{label}</dt><dd className="font-black text-stone-950">{value}</dd></div>)}</dl><div className="mt-4 grid grid-cols-3 gap-2"><Link href="/documents" className="rounded-xl bg-violet-50 px-2 py-3 text-center text-[10px] font-extrabold text-violet-800">Документы</Link><Link href="/votes" className="rounded-xl bg-amber-50 px-2 py-3 text-center text-[10px] font-extrabold text-amber-900">Голосования</Link><Link href="/finance" className="rounded-xl bg-green-50 px-2 py-3 text-center text-[10px] font-extrabold text-green-800">Финансы</Link></div></section>
            </div>
            <section className="rounded-[24px] border border-stone-200 bg-white p-5"><div className="flex items-center justify-between gap-3"><div><h2 className="text-sm font-extrabold text-stone-950">Операции управления</h2><p className="text-xs text-stone-500">Коммуникации, отчёты и контроль</p></div><Settings2 className="h-5 w-5 text-stone-500" /></div><div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4"><button onClick={() => void sendBroadcast()} className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl bg-green-800 px-2 text-[10px] font-extrabold text-white"><Send className="h-4 w-4" />Рассылка</button><button onClick={exportAdminReport} className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl bg-violet-50 px-2 text-[10px] font-extrabold text-violet-800"><Download className="h-4 w-4" />Экспорт</button><Link href="/operations" className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl bg-amber-50 px-2 text-[10px] font-extrabold text-amber-900"><Shield className="h-4 w-4" />Безопасность</Link><Link href="/admin/settings" className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl bg-stone-100 px-2 text-[10px] font-extrabold text-stone-800"><Settings2 className="h-4 w-4" />Настройки ЖК</Link></div>{broadcastStatus && <p role="status" className="mt-3 rounded-xl bg-emerald-50 p-3 text-xs font-bold text-emerald-900">{broadcastStatus}</p>}<div className="mt-4 grid gap-2 sm:grid-cols-3"><p className="rounded-xl bg-stone-50 p-3 text-[10px] font-bold text-stone-600">Модерация: {marketplace.reports.filter((report) => report.status === "new").length} новых жалоб</p><p className="rounded-xl bg-stone-50 p-3 text-[10px] font-bold text-stone-600">Журнал безопасности: {accessEvents.length} событий</p><p className="rounded-xl bg-stone-50 p-3 text-[10px] font-bold text-stone-600">Ознакомление: {documents.filter((document) => document.acknowledged).length}/{documents.filter((document) => document.requiresAcknowledgement).length || documents.length}</p></div></section>
          </div>
        )}

        {/* Вкладка 1: Очередь верификации */}
        {activeTab === "requests" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900 text-sm">
                Входящие заявки жителей ({pendingRequests.length})
              </h2>
              <p className="text-xs text-gray-400">Проверьте документы и подтвердите статус</p>
            </div>

            {verificationRequests.length === 0 ? (
              <div className="p-12 text-center text-gray-400 bg-gray-50 rounded-3xl">
                <FileCheck className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-xs font-semibold">Все заявки рассмотрены</p>
              </div>
            ) : (
              <div className="space-y-3">
                {verificationRequests.map((req) => (
                  <div
                    key={req.id}
                    className={`p-4 rounded-3xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      req.status === "pending"
                        ? "bg-white border-gray-200/90 shadow-sm"
                        : req.status === "approved"
                        ? "bg-green-50/40 border-green-100 opacity-80"
                        : "bg-red-50/30 border-red-100 opacity-60"
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <div
                        onClick={() => setSelectedDocImage(req.documentUrl)}
                        className="w-16 h-16 rounded-2xl bg-gray-100 overflow-hidden ring-1 ring-black/5 cursor-pointer relative group shrink-0"
                      >
                        <NextImage
                          src={req.documentUrl}
                          alt="Документ"
                          fill
                          sizes="64px"
                          unoptimized
                          className="object-cover group-hover:scale-105 transition"
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition">
                          <Eye className="w-4 h-4" />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-gray-900 text-sm">{req.fullName}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            req.status === "approved"
                              ? "bg-green-100 text-green-800"
                              : req.status === "rejected"
                              ? "bg-red-100 text-red-800"
                              : "bg-amber-100 text-amber-800"
                          }`}>
                            {req.status === "approved" ? "Одобрено" : req.status === "rejected" ? "Отклонено" : "На проверке"}
                          </span>
                        </div>

                        <p className="text-xs text-gray-600 font-semibold flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-green-600" />
                          Дом {req.buildingNumber}, подъезд {req.entranceNumber}, кв. {req.apartmentNumber}
                        </p>

                        <p className="text-[11px] text-gray-400">
                          {req.documentType} • {req.submittedAt}
                        </p>
                      </div>
                    </div>

                    {req.status === "pending" && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => approveVerification(req.id)}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" /> Одобрить
                        </button>
                        <button
                          onClick={() => rejectVerification(req.id)}
                          className="px-3.5 py-2 bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-600 font-bold text-xs rounded-xl flex items-center gap-1.5 transition"
                        >
                          <X className="w-3.5 h-3.5" /> Отклонить
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Вкладка 2: Реестр жильцов */}
        {activeTab === "residents" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900 text-sm">База жильцов ЖК (120 квартир)</h2>
              <span className="text-xs font-semibold text-green-600">89 подтверждено</span>
            </div>

            <div className="divide-y divide-gray-100 rounded-3xl border border-gray-200 overflow-hidden bg-white">
              {[
                { name: "Мария Иванова", apt: "Дом 2, кв. 45", phone: "+7 (777) 234-56-78", role: "Администратор", verified: true },
                { name: "Алексей Петров", apt: "Дом 1, кв. 12", phone: "+7 (701) 444-55-66", role: "Житель", verified: true },
                { name: "Олег Смирнов", apt: "Дом 1, кв. 3", phone: "+7 (775) 123-99-88", role: "Мастер-электрик", verified: true },
                { name: "Бауыржан Сапаров", apt: "Дом 1, кв. 28", phone: "+7 (701) 987-65-43", role: "Житель", verified: false },
              ].map((res, idx) => (
                <div key={idx} className="p-4 flex items-center justify-between hover:bg-gray-50 transition">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-100 text-green-800 font-bold flex items-center justify-center text-xs">
                      {res.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-xs">{res.name}</p>
                      <p className="text-[11px] text-gray-500">{res.apt} • {res.phone}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-[11px] font-bold">
                      {res.role}
                    </span>
                    <span className={`w-2 h-2 rounded-full ${res.verified ? "bg-green-500" : "bg-amber-400"}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Вкладка 3: Экстренное оповещение */}
        {activeTab === "alert" && (
          <div className="space-y-5 max-w-xl">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-3xl space-y-1">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Срочные уведомления жителям ЖК</span>
              </div>
              <p className="text-[11px] text-amber-700 leading-relaxed">
                Сообщение отобразится в красной плашке на главной странице у всех жителей дома и ЖК.
              </p>
            </div>

            <form onSubmit={handleSaveAlert} className="space-y-4 bg-white p-5 border border-gray-200 rounded-3xl shadow-xs">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Заголовок оповещения
                </label>
                <input
                  type="text"
                  value={alertTitle}
                  onChange={(e) => setAlertTitle(e.target.value)}
                  placeholder="Например: Отключение горячей воды 26 мая"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Текст сообщения
                </label>
                <textarea
                  rows={3}
                  value={alertMessage}
                  onChange={(e) => setAlertMessage(e.target.value)}
                  placeholder="Укажите подробности, время возобновления подачи и контакты аварийной службы..."
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md transition"
                >
                  Опубликовать экстренное оповещение
                </button>
                {urgentAlert && (
                  <button
                    type="button"
                    onClick={handleDisableAlert}
                    className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition"
                  >
                    Снять оповещение
                  </button>
                )}
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Модалка просмотра документа */}
      {selectedDocImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="max-w-2xl w-full bg-white rounded-3xl overflow-hidden p-4 space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-sm">Просмотр документа жителя</h3>
              <button onClick={() => setSelectedDocImage(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <NextImage src={selectedDocImage} alt="Документ" width={1200} height={900} unoptimized className="h-auto w-full max-h-[70vh] object-contain rounded-2xl" />
          </div>
        </div>
      )}
    </div>
  );
}
