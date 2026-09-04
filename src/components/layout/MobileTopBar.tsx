"use client";

import Link from "next/link";
import NextImage from "next/image";
import { Bell, ShieldCheck } from "lucide-react";
import { useAppStore } from "@/stores/appStore";
import { complexName } from "@/lib/appConfig";

export default function MobileTopBar() {
  const currentUser = useAppStore((state) => state.currentUser);
  const unread = useAppStore((state) => state.notifications.filter((item) => !item.isRead).length);

  return (
    <header className="sticky top-0 z-50 flex min-h-16 items-center justify-between border-b border-stone-200/80 bg-[#f8f7f2]/92 px-4 backdrop-blur-xl md:hidden">
      <Link href="/feed" className="flex min-h-11 items-center gap-2.5 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700">
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-green-800 text-sm font-black text-white shadow-[0_8px_24px_rgba(22,101,52,.18)]">
          K
        </span>
        <span className="min-w-0">
          <span className="flex items-center gap-1 text-sm font-extrabold text-stone-950">
            {complexName(currentUser.complexName)}
            <ShieldCheck className="h-3.5 w-3.5 text-green-700" aria-hidden="true" />
          </span>
          <span className="block truncate text-[11px] font-medium text-stone-600">Дом {currentUser.buildingNumber} · кв. {currentUser.apartmentNumber}</span>
        </span>
      </Link>

      <div className="flex items-center gap-1">
        <Link href="/notifications" className="relative grid h-11 w-11 place-items-center rounded-2xl text-stone-600 transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700" aria-label="Уведомления">
          <Bell className="h-5 w-5" aria-hidden="true" />
          {unread > 0 && <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border-2 border-[#f8f7f2] bg-rose-500" />}
        </Link>
        <Link href="/profile" className="grid h-11 w-11 place-items-center rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700" aria-label="Открыть профиль">
          <NextImage src={currentUser.avatarUrl || "/icons/icon-192x192.png"} alt="" width={36} height={36} unoptimized className="h-9 w-9 rounded-xl object-cover ring-2 ring-white" />
        </Link>
      </div>
    </header>
  );
}
