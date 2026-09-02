"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageSquare, Plus, Building2, User } from "lucide-react";

import { useAppStore } from "@/stores/appStore";

export default function BottomNav() {
  const pathname = usePathname();
  const totalUnread = useAppStore((s) => s.chats).reduce((acc, c) => acc + c.unreadCount, 0);

  const navItems = [
    { href: "/feed", label: "Главная", icon: Home },
    { href: "/chats", label: "Чаты", icon: MessageSquare },
    { href: "/create", label: "Создать", icon: Plus, isCreate: true },
    { href: "/hoa", label: "Мой ЖК", icon: Building2 },
    { href: "/profile", label: "Профиль", icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-xl border-t border-gray-100/80 px-4 py-2">
      <div className="flex items-center justify-around relative">
        {navItems.map((item) => {
          if (item.isCreate) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative -top-5 w-14 h-14 bg-gradient-to-tr from-green-600 to-emerald-500 rounded-full flex items-center justify-center text-white shadow-xl shadow-green-600/40 hover:shadow-green-600/60 active:scale-90 transition-all duration-200 ring-4 ring-white"
                aria-label="Создать публикацию"
              >
                <Plus className="w-6 h-6 stroke-[3]" />
              </Link>
            );
          }

          const isActive = pathname === item.href || (item.href !== "/feed" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all duration-150 active:scale-95 ${
                isActive
                  ? "text-green-600 font-bold"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? "scale-110 stroke-[2.4]" : "stroke-[1.8]"}`} />
                {isActive && (
                  <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-green-600 rounded-full" />
                )}
                {item.href === '/chats' && totalUnread > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-600 text-white text-[9px] font-bold flex items-center justify-center">
                    {totalUnread > 9 ? '9+' : totalUnread}
                  </span>
                )}
              </div>
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
