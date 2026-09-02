"use client";

import { useState } from "react";
import Link from "next/link";
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
  ChevronRight
} from "lucide-react";
import { useAppStore } from "@/stores/appStore";

export default function AdminPage() {
  const { 
    verificationRequests, 
    approveVerification, 
    rejectVerification, 
    urgentAlert, 
    setUrgentAlert,
    currentUser,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<"requests" | "residents" | "alert" | "stats">("requests");
  const [selectedDocImage, setSelectedDocImage] = useState<string | null>(null);

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
      active: true,
      createdAt: "Только что",
    });
  };

  const handleDisableAlert = () => {
    setUrgentAlert(null);
    setAlertTitle("");
    setAlertMessage("");
  };

  const pendingRequests = verificationRequests.filter((r) => r.status === "pending");

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
                        <img
                          src={req.documentUrl}
                          alt="Документ"
                          className="w-full h-full object-cover group-hover:scale-105 transition"
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
            <img src={selectedDocImage} alt="Документ" className="w-full max-h-[70vh] object-contain rounded-2xl" />
          </div>
        </div>
      )}
    </div>
  );
}
