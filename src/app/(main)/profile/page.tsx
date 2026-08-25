"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ShieldCheck, 
  MapPin, 
  Phone, 
  Edit3, 
  Tag, 
  CreditCard, 
  Bell, 
  X,
  CheckCircle2,
  Calendar,
  Building2,
  Share2,
  LogOut
} from "lucide-react";
import { useAppStore } from "@/stores/appStore";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function ProfilePage() {
  const router = useRouter();
  const { currentUser, updateUser, posts, logoutUser } = useAppStore();

  const [activeTab, setActiveTab] = useState<"posts" | "announcements" | "payments" | "settings">("posts");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState(currentUser.fullName);
  const [editPhone, setEditPhone] = useState(currentUser.phone);
  const [editApartment, setEditApartment] = useState(currentUser.apartmentNumber);
  const [editBuilding, setEditBuilding] = useState(currentUser.buildingNumber);

  const myPosts = posts.filter((p) => p.author?.full_name === currentUser.fullName || p.author_id === currentUser.id);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({
      fullName: editName,
      phone: editPhone,
      ...(!isSupabaseConfigured() && {
        apartmentNumber: editApartment,
        buildingNumber: editBuilding,
      }),
    });
    setIsEditModalOpen(false);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logoutUser();
      router.replace("/login");
      router.refresh();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-white pb-12">
      {/* Обложка профиля (Cover Banner) */}
      <div className="h-44 sm:h-52 bg-gradient-to-r from-emerald-600 via-green-600 to-teal-700 relative overflow-hidden">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="absolute top-4 right-4 flex gap-2">
          <button className="px-3 py-1.5 bg-black/30 hover:bg-black/50 backdrop-blur-md text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition">
            <Share2 className="w-3.5 h-3.5" /> Поделиться
          </button>
        </div>
      </div>

      {/* Информационная шапка профиля */}
      <div className="px-6 pb-6 relative">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 sm:-mt-20 mb-4">
          <div className="relative inline-block">
            <img
              src={currentUser.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80"}
              alt={currentUser.fullName}
              className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl object-cover ring-4 ring-white shadow-xl bg-white"
            />
            {currentUser.verified && (
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center shadow-lg ring-2 ring-white">
                <ShieldCheck className="w-5 h-5" />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition"
            >
              <Edit3 className="w-3.5 h-3.5" /> Редактировать
            </button>
            {!currentUser.verified ? (
              <Link
                href="/verify-resident"
                className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
              >
                Подтвердить статус
              </Link>
            ) : (
              <span className="px-3.5 py-2 bg-green-50 text-green-700 text-xs font-bold rounded-xl flex items-center gap-1 border border-green-200">
                <CheckCircle2 className="w-3.5 h-3.5" /> Житель подтверждён
              </span>
            )}
          </div>
        </div>

        {/* Имя и данные */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              {currentUser.fullName}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs font-medium text-gray-500">
            <span className="flex items-center gap-1.5 text-gray-700">
              <Building2 className="w-4 h-4 text-green-600" />
              ЖК «Солнечный», Дом {currentUser.buildingNumber}, Подъезд {currentUser.entranceNumber}, кв. {currentUser.apartmentNumber}
            </span>
            <span className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-gray-400" />
              {currentUser.phone}
            </span>
          </div>
        </div>

        {/* Статистика жителя */}
        <div className="grid grid-cols-3 gap-3 my-6">
          <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 text-center">
            <p className="text-lg font-black text-gray-900">{myPosts.length}</p>
            <p className="text-[11px] font-semibold text-gray-500">Публикаций</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 text-center">
            <p className="text-lg font-black text-gray-900">5 000 ₸</p>
            <p className="text-[11px] font-semibold text-gray-500">Взносов в ЖК</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 text-center">
            <p className="text-lg font-black text-green-600">100%</p>
            <p className="text-[11px] font-semibold text-gray-500">Доверие</p>
          </div>
        </div>

        {/* Вкладки профиля */}
        <div className="flex border-b border-gray-200 gap-6 text-sm font-bold">
          {[
            { id: "posts", label: "Мои записи" },
            { id: "announcements", label: "Объявления" },
            { id: "payments", label: "История взносов" },
            { id: "settings", label: "Настройки" },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-3 border-b-2 transition ${
                  isActive
                    ? "border-green-600 text-green-700 font-extrabold"
                    : "border-transparent text-gray-500 hover:text-gray-900"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Контент активной вкладки */}
        <div className="pt-6">
          {activeTab === "posts" && (
            <div className="space-y-4">
              {myPosts.length === 0 ? (
                <div className="p-12 text-center text-gray-400 bg-gray-50 rounded-3xl">
                  <p className="text-xs font-semibold">У вас пока нет опубликованных записей</p>
                  <Link href="/create" className="text-xs text-green-600 font-bold underline mt-1 inline-block">
                    Создать первую запись
                  </Link>
                </div>
              ) : (
                myPosts.map((p) => (
                  <div key={p.id} className="p-4 rounded-3xl bg-gray-50 border border-gray-100 space-y-2">
                    <p className="text-xs text-gray-800 leading-relaxed">{p.content}</p>
                    <div className="flex justify-between items-center text-[11px] text-gray-400 pt-2 border-t border-gray-200/50">
                      <span>Лайков: {p.reactions_count || 0}</span>
                      <span>Комментариев: {p.comments_count || 0}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "announcements" && (
            <div className="p-4 rounded-3xl bg-gray-50 border border-gray-100 flex items-center justify-between">
              <div className="space-y-1">
                <span className="px-2 py-0.5 bg-green-100 text-green-800 text-[10px] font-bold rounded-full">
                  Активно
                </span>
                <h4 className="font-bold text-gray-900 text-sm">Продам диван</h4>
                <p className="text-xs font-bold text-green-600">5 000 ₸</p>
              </div>
              <button className="text-xs font-bold text-gray-500 hover:text-red-500">
                Снять с публикации
              </button>
            </div>
          )}

          {activeTab === "payments" && (
            <div className="space-y-2">
              <div className="p-4 rounded-3xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-gray-900 text-xs">Благоустройство двора</h4>
                  <p className="text-[11px] text-gray-400">15 мая 2026 • Kaspi Pay</p>
                </div>
                <div className="text-right">
                  <span className="font-extrabold text-green-700 text-sm">+ 5 000 ₸</span>
                  <p className="text-[10px] text-green-600 font-bold flex items-center justify-end gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Оплачено
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="space-y-4 max-w-md">
              <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl">
                <div>
                  <p className="font-bold text-xs text-gray-900">Уведомления ОСИ</p>
                  <p className="text-[10px] text-gray-400">Плановые работы, отключения воды и электричества</p>
                </div>
                <span className="text-[10px] font-bold text-gray-400">В настройках ОСИ</span>
              </div>
              <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl">
                <div>
                  <p className="font-bold text-xs text-gray-900">SMS-подтверждения</p>
                  <p className="text-[10px] text-gray-400">Коды входа и подтверждения номера телефона</p>
                </div>
                <span className="text-[10px] font-bold text-gray-400">Через OneSignal</span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full flex items-center justify-center gap-2 p-3.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-2xl text-xs font-bold disabled:opacity-50 transition"
              >
                <LogOut className="w-4 h-4" />
                {isLoggingOut ? "Выход..." : "Выйти из аккаунта"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Модалка редактирования профиля */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-sm">Редактирование профиля жителя</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Имя и Фамилия</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Номер телефона</label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Дом №</label>
                  <input
                    type="text"
                    value={editBuilding}
                    onChange={(e) => setEditBuilding(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Квартира №</label>
                  <input
                    type="text"
                    value={editApartment}
                    onChange={(e) => setEditApartment(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-xl shadow-md transition"
                >
                  Сохранить изменения
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
