"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Home, 
  MessageSquare, 
  Tag, 
  Building2, 
  User, 
  Plus, 
  ShieldCheck, 
  Settings, 
  ShieldAlert,
  LogOut
} from "lucide-react";
import { useAppStore } from "@/stores/appStore";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const currentUser = useAppStore((s) => s.currentUser);
  const chats = useAppStore((s) => s.chats);
  const verificationRequests = useAppStore((s) => s.verificationRequests);
  const logoutUser = useAppStore((s) => s.logoutUser);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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

  const totalUnread = chats.reduce((acc, c) => acc + c.unreadCount, 0);
  const pendingRequests = verificationRequests.filter((r) => r.status === "pending").length;

  const menuItems = [
    { href: "/feed", label: "Лента новостей", icon: Home },
    { href: "/chats", label: "Мессенджер", icon: MessageSquare, badge: totalUnread > 0 ? totalUnread : undefined },
    { href: "/classifieds", label: "Объявления и услуги", icon: Tag },
    { href: "/hoa", label: "Мой ЖК (ОСИ)", icon: Building2 },
    { href: "/profile", label: "Моя страница", icon: User },
    { href: "/admin", label: "Панель управления", icon: ShieldAlert, badge: pendingRequests > 0 ? pendingRequests : undefined, isAdmin: true },
  ];

  const visibleMenuItems = menuItems.filter((item) => !item.isAdmin || currentUser.role === 'admin' || currentUser.role === 'hoa_official');

  return (
    <>
      <aside className="w-64 shrink-0 hidden md:flex flex-col justify-between sticky top-0 h-screen p-4 border-r border-gray-200/80 bg-white select-none">
        <div className="space-y-4">
          {/* Логотип ЖК */}
          <Link href="/feed" className="flex items-center gap-3 px-2 py-1 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-green-600 to-emerald-500 flex items-center justify-center text-white font-black text-sm shadow-md shadow-green-600/30 group-hover:scale-105 transition-transform">
              ЖК
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-extrabold text-gray-900 text-base leading-tight">Солнечный</span>
                <ShieldCheck className="w-4 h-4 text-green-600 shrink-0" />
              </div>
              <p className="text-[11px] text-gray-400 font-medium">Закрытая сеть ЖК</p>
            </div>
          </Link>

          {/* Мини-профиль с кнопкой быстрой смены аккаунта */}
          <div className="p-2.5 rounded-2xl bg-gray-50 border border-gray-100 space-y-2">
            <Link href="/profile" className="flex items-center gap-2.5 group">
              <img
                src={currentUser.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80"}
                alt={currentUser.fullName}
                className="w-10 h-10 rounded-xl object-cover ring-2 ring-white shadow-xs shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 text-xs truncate group-hover:text-green-700 transition">
                  {currentUser.fullName}
                </p>
                <p className="text-[10px] font-semibold text-green-700 truncate">
                  {currentUser.roleLabel || `Дом ${currentUser.buildingNumber}, кв. ${currentUser.apartmentNumber}`}
                </p>
              </div>
            </Link>

          </div>

          {/* Меню навигации */}
          <nav className="space-y-1">
            {visibleMenuItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/feed" && pathname.startsWith(item.href));
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition ${
                    isActive
                      ? item.isAdmin ? "bg-zinc-900 text-white font-bold" : "bg-green-50 text-green-700 font-bold"
                      : "text-gray-600 hover:bg-gray-100/80 hover:text-gray-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${isActive ? item.isAdmin ? "text-white" : "text-green-600 stroke-[2.4]" : "text-gray-400 stroke-[1.8]"}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className={`px-2 py-0.5 rounded-full text-white text-[10px] font-black ${item.isAdmin ? "bg-amber-600" : "bg-green-600"}`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Кнопка создания записи */}
          <Link
            href="/create"
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-green-600 hover:bg-green-700 active:scale-95 text-white font-bold text-sm rounded-2xl shadow-md shadow-green-600/20 transition"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Создать запись</span>
          </Link>
        </div>

        {/* Футер сайдбара */}
        <div className="pt-4 border-t border-gray-100 space-y-3 px-2">
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-50 transition"
          >
            <LogOut className="w-4 h-4" />
            {isLoggingOut ? "Выход..." : "Выйти из аккаунта"}
          </button>
          <div className="text-xs text-gray-400 flex items-center justify-between">
            <span>© 2026 Korshi</span>
            <Link href="/profile" className="hover:text-gray-600">
              <Settings className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </aside>

    </>
  );
}
