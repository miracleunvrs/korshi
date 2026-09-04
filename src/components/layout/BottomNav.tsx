"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardCheck, Home, MessageSquare, Plus, Building2 } from "lucide-react";

import { useAppStore } from "@/stores/appStore";

export default function BottomNav() {
  const pathname = usePathname();
  const totalUnread = useAppStore((s) => s.chats).reduce((acc, c) => acc + c.unreadCount, 0);
  const activeRequests = useAppStore((s) => s.serviceRequests.filter((request) => request.status === "submitted" || request.status === "in_progress").length);

  const navItems = [
    { href: "/feed", label: "Сегодня", icon: Home },
    { href: "/chats", label: "Чаты", icon: MessageSquare },
    { href: "/create", label: "Создать", icon: Plus, isCreate: true },
    { href: "/requests", label: "Заявки", icon: ClipboardCheck },
    { href: "/hoa", label: "Мой дом", icon: Building2 },
  ];

  return (
    <nav className="glass-nav fixed inset-x-0 bottom-0 z-40 border-t border-stone-200/80 px-2 pb-[max(.5rem,env(safe-area-inset-bottom))] pt-2">
      <div className="relative mx-auto flex max-w-xl items-center justify-around">
        {navItems.map((item) => {
          if (item.isCreate) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative -top-5 flex h-14 w-14 items-center justify-center rounded-full bg-violet-600 text-white shadow-[0_12px_30px_rgba(124,58,237,.3)] ring-4 ring-[#fffefb] transition-all duration-200 hover:-translate-y-0.5 hover:bg-violet-700 active:scale-90"
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
              className={`flex min-h-12 min-w-[58px] flex-col items-center justify-center gap-1 rounded-2xl px-2 py-1 transition-all duration-200 active:scale-95 ${
                isActive
                  ? "bg-green-50 text-green-800 font-bold"
                  : "text-stone-600 hover:text-stone-800"
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
                {item.href === '/requests' && activeRequests > 0 && (
                  <span className="absolute -right-2 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-amber-500 px-1 text-[9px] font-black text-white">
                    {activeRequests > 9 ? '9+' : activeRequests}
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
