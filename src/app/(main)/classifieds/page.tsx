"use client";

import { useState } from "react";
import Link from "next/link";
import NextImage from "next/image";
import { Plus, Search, Tag, Heart } from "lucide-react";
import { useAppStore } from "@/stores/appStore";
import { complexName } from "@/lib/appConfig";
import { useOperationsStore } from "@/stores/operationsStore";

export default function ClassifiedsPage() {
  const [activeTab, setActiveTab] = useState<"all" | "Объявления" | "Услуги" | "Подработки" | "Помощь">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { classifieds, currentUser } = useAppStore();
  const { marketplace, toggleFavorite } = useOperationsStore();

  const filteredClassifieds = classifieds.filter((item) => {
    if (activeTab !== "all" && item.category !== activeTab) return false;
    if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase()) && !item.description.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return !marketplace.archivedIds.includes(item.id);
  });

  return (
    <div className="min-h-screen bg-[#fffefb] pb-16">
      {/* Header */}
      <div className="glass-nav sticky top-16 z-20 space-y-3 border-b border-stone-200/80 px-4 py-4 shadow-xs sm:px-6 md:top-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-extrabold text-gray-900 text-lg">Объявления и услуги</h1>
            <p className="text-xs text-stone-500">Только для жителей ЖК «{complexName(currentUser.complexName)}»</p>
          </div>
          <Link
            href="/create"
            className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-2xl bg-green-800 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-green-900 active:scale-95"
          >
            <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Подать объявление</span><span className="sm:hidden">Добавить</span>
          </Link>
        </div>

        {/* Поиск */}
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск товаров, услуг сантехника, электрика..."
            className="w-full pl-9 pr-4 py-2.5 bg-gray-100 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition"
          />
        </div>

        {/* Категории */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {[
            { id: "all", label: "Все категории" },
            { id: "Объявления", label: "Товары" },
            { id: "Услуги", label: "Мастера ЖК" },
            { id: "Подработки", label: "Подработка" },
            { id: "Помощь", label: "Взаимопомощь" },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition ${
                  isActive
                    ? "bg-green-600 text-white shadow-sm shadow-green-600/30"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Список объявлений */}
      <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-6">
        {filteredClassifieds.length === 0 ? (
          <div className="col-span-2 p-16 text-center text-gray-400">
            <Tag className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm font-semibold">Объявлений в этой категории пока нет</p>
          </div>
        ) : (
          filteredClassifieds.map((item) => (
            <article
              key={item.id}
              className="bg-white rounded-3xl border border-gray-200/90 overflow-hidden shadow-xs hover:shadow-md hover:border-green-300 transition group flex flex-col justify-between"
            >
              <div>
                <div className="h-44 w-full bg-gray-100 overflow-hidden relative">
                  <Link href={`/classifieds/${item.id}`} aria-label={`Открыть ${item.title}`}><NextImage src={item.image} alt={item.title} fill sizes="(max-width: 640px) 100vw, 384px" unoptimized className="object-cover group-hover:scale-105 transition duration-300" /></Link>
                  <span className="absolute top-3 left-3 px-2.5 py-1 bg-black/60 backdrop-blur-md text-white rounded-full text-[10px] font-bold">
                    {item.category}
                  </span>
                  <button onClick={() => toggleFavorite(item.id)} className={`absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/90 shadow ${marketplace.favoriteIds.includes(item.id) ? "text-rose-600" : "text-stone-600"}`} aria-label="Избранное"><Heart className={`h-4 w-4 ${marketplace.favoriteIds.includes(item.id) ? "fill-current" : ""}`} /></button>
                </div>

                <div className="p-4 space-y-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <Link href={`/classifieds/${item.id}`} className="font-extrabold text-gray-900 text-sm group-hover:text-green-700 transition line-clamp-1">{item.title}</Link>
                  </div>

                  <p className="text-base font-black text-green-700">
                    {item.price}
                  </p>

                  <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>

              <Link href={`/classifieds/${item.id}`} className="px-4 py-3 bg-gray-50/70 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                <span className="font-medium truncate">{item.location}</span>
                <span className="text-green-700 font-bold flex items-center gap-1 shrink-0">
                  Открыть →
                </span>
              </Link>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
