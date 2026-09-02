"use client";

import { useState } from "react";
import { 
  Bell, 
  SlidersHorizontal, 
  Image as ImageIcon, 
  BarChart3, 
  Lightbulb, 
  Tag, 
  Send,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  X
} from "lucide-react";
import Link from "next/link";
import PostCard from "@/components/feed/PostCard";
import FeedFilterModal from "@/components/feed/FeedFilterModal";
import { useAppStore } from "@/stores/appStore";
import type { PostWithAuthor } from "@/types";

export default function FeedPage() {
  const [activeChip, setActiveChip] = useState("Весь ЖК");
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [selectedTerritory, setSelectedTerritory] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Quick post creator state
  const [quickPostText, setQuickPostText] = useState("");
  const [quickPostType, setQuickPostType] = useState<"post" | "announcement" | "poll">("post");

  const { posts, addPost, deletePost, likePost, unlikePost, votePoll, supportInitiative, currentUser, urgentAlert, setUrgentAlert, notifications, markNotificationRead } = useAppStore();
  const unreadNotifications = notifications.filter((notification) => !notification.isRead).length;

  const chips = ["Весь ЖК", "Мой дом", "Мой подъезд", "Официальное", "Объявления", "Опросы"];

  const handleQuickPostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPostText.trim()) return;

    const newPost: PostWithAuthor = {
      id: `post-${Date.now()}`,
      author_id: currentUser.id,
      complex_id: currentUser.complexId || "complex-1",
      building_id: currentUser.buildingId || `building-${currentUser.buildingNumber}`,
      entrance_id: null,
      type: quickPostType,
      title: null,
      content: quickPostText.trim(),
      status: "active",
      is_official: currentUser.role === "hoa_official",
      territory: "complex",
      price: null,
      currency: null,
      views_count: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      author: {
        id: currentUser.id,
        full_name: currentUser.fullName,
        avatar_url: currentUser.avatarUrl || null,
        role: currentUser.role,
        verified: currentUser.verified,
      },
      reactions_count: 0,
      comments_count: 0,
    };

    addPost(newPost);
    setQuickPostText("");
  };

  const filteredPosts = posts.filter((post) => {
    // Чип фильтрация
    if (activeChip === "Мой дом" && post.territory !== "building" && post.territory !== "complex") return false;
    if (activeChip === "Мой подъезд" && post.territory !== "entrance") return false;
    if (activeChip === "Официальное" && !post.is_official) return false;
    if (activeChip === "Объявления" && post.type !== "announcement" && post.type !== "service") return false;
    if (activeChip === "Опросы" && post.type !== "poll" && post.type !== "official_poll") return false;

    // Модальные фильтры
    if (selectedTerritory === "building" && post.territory !== "building") return false;
    if (selectedTerritory === "entrance" && post.territory !== "entrance") return false;

    if (selectedType === "post" && post.type !== "post") return false;
    if (selectedType === "announcement" && post.type !== "announcement") return false;
    if (selectedType === "service" && post.type !== "service") return false;
    if (selectedType === "poll_initiative" && post.type !== "poll" && post.type !== "official_poll" && post.type !== "initiative") return false;
    if (selectedType === "official" && !post.is_official) return false;

    return true;
  });

  const handleResetFilters = () => {
    setSelectedTerritory("all");
    setSelectedType("all");
    setActiveChip("Весь ЖК");
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Шапка ленты */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 sm:px-6 py-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="font-extrabold text-gray-900 text-lg sm:text-xl">Новости ЖК</h1>
            <span className="px-2 py-0.5 bg-green-50 text-green-700 text-xs font-bold rounded-full">
              Солнечный
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsFilterModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Фильтры</span>
            </button>
            <button
              onClick={() => setNotificationsOpen((open) => !open)}
              className="relative w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-full transition"
              aria-label="Уведомления"
              aria-expanded={notificationsOpen}
            >
              <Bell className="w-4 h-4" />
              {unreadNotifications > 0 && (
                <span className="absolute mt-[-18px] ml-5 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-black leading-4">
                  {unreadNotifications > 9 ? "9+" : unreadNotifications}
                </span>
              )}
            </button>
          </div>
        </div>

        {notificationsOpen && (
          <div className="absolute right-4 sm:right-6 top-14 z-30 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <p className="text-sm font-extrabold text-gray-900">Уведомления</p>
              {unreadNotifications > 0 && <span className="text-xs font-bold text-green-600">{unreadNotifications} новых</span>}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-gray-500">Пока уведомлений нет</p>
              ) : notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => { void markNotificationRead(notification.id).catch(() => undefined); }}
                  className={`w-full border-b border-gray-50 px-4 py-3 text-left transition hover:bg-gray-50 ${notification.isRead ? "opacity-60" : "bg-green-50/60"}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-bold text-gray-900">{notification.title}</p>
                    <span className="shrink-0 text-[10px] text-gray-400">{notification.createdAt}</span>
                  </div>
                  {notification.body && <p className="mt-1 text-xs leading-relaxed text-gray-600">{notification.body}</p>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Чипы фильтрации по аудитории */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {chips.map((chip) => {
            const isActive = activeChip === chip;
            return (
              <button
                key={chip}
                onClick={() => setActiveChip(chip)}
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition ${
                  isActive
                    ? "bg-green-600 text-white shadow-sm shadow-green-600/30"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900"
                }`}
              >
                {chip}
              </button>
            );
          })}
        </div>
      </div>

      {/* Экстренное оповещение ОСИ (Красная плашка) */}
      {urgentAlert?.active && (
        <div className="m-4 p-4 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-3xl shadow-lg shadow-red-500/20 flex items-start justify-between gap-3 animate-in fade-in duration-300">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-white/30 px-2 py-0.5 rounded-full">
                  Срочно от ОСИ
                </span>
                <span className="text-[10px] opacity-80">{urgentAlert.createdAt}</span>
              </div>
              <h3 className="font-extrabold text-sm leading-snug">{urgentAlert.title}</h3>
              <p className="text-xs text-red-50 leading-relaxed pt-0.5">{urgentAlert.message}</p>
            </div>
          </div>
          <button
            onClick={() => setUrgentAlert(null)}
            className="text-white/80 hover:text-white p-1 hover:bg-white/10 rounded-full transition"
            aria-label="Закрыть"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Быстрое создание записи (как в ВК) */}
      <div className="p-4 sm:p-5 border-b border-gray-100 bg-white">
        <form onSubmit={handleQuickPostSubmit} className="space-y-3">
          <div className="flex items-start gap-3">
            <img
              src={currentUser.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80"}
              alt=""
              className="w-10 h-10 rounded-xl object-cover ring-2 ring-gray-100 shrink-0"
            />
            <textarea
              rows={2}
              value={quickPostText}
              onChange={(e) => setQuickPostText(e.target.value)}
              placeholder={`Что нового в ЖК, ${currentUser.fullName.split(" ")[0]}? Поделитесь с соседями...`}
              className="w-full bg-gray-50 hover:bg-gray-100/70 focus:bg-white border border-gray-200 rounded-2xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition resize-none"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setQuickPostType("post")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                  quickPostType === "post" ? "bg-green-50 text-green-700 font-bold" : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5 text-green-600" />
                <span>Фото</span>
              </button>
              <Link
                href="/create"
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-100 flex items-center gap-1.5 transition"
              >
                <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
                <span>Опрос</span>
              </Link>
              <Link
                href="/create"
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-100 flex items-center gap-1.5 transition"
              >
                <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                <span>Инициатива</span>
              </Link>
            </div>

            <button
              type="submit"
              disabled={!quickPostText.trim()}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-xl disabled:opacity-40 shadow-xs active:scale-95 transition flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Опубликовать</span>
            </button>
          </div>
        </form>
      </div>

      {/* Список постов */}
      <div className="divide-y divide-gray-100">
        {filteredPosts.length === 0 ? (
          <div className="p-16 text-center text-gray-400 space-y-3">
            <p className="text-sm font-semibold">Публикаций по выбранным фильтрам не найдено</p>
            <button
              onClick={handleResetFilters}
              className="text-xs text-green-600 font-bold underline"
            >
              Сбросить фильтры
            </button>
          </div>
        ) : (
          filteredPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onVote={(pollId, optionId) => votePoll(post.id, optionId)}
              onSupportInitiative={(initiativeId) => supportInitiative(initiativeId)}
              onLike={likePost}
              onUnlike={unlikePost}
              onDelete={post.author_id === currentUser.id ? deletePost : undefined}
            />
          ))
        )}
      </div>

      {/* Модалка фильтров */}
      <FeedFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        selectedTerritory={selectedTerritory}
        onSelectTerritory={setSelectedTerritory}
        selectedType={selectedType}
        onSelectType={setSelectedType}
        onReset={handleResetFilters}
      />
    </div>
  );
}
