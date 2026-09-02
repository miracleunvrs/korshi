"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Search, CheckCheck } from "lucide-react";
import { useAppStore } from "@/stores/appStore";

export default function ChatsPage() {
  const [activeTab, setActiveTab] = useState<"all" | "my" | "unread">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { chats } = useAppStore();

  const filteredChats = chats.filter((chat) => {
    if (activeTab === "unread" && chat.unreadCount === 0) return false;
    if (activeTab === "my" && chat.type !== "direct") return false;
    if (searchQuery && !chat.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 py-3 space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="font-bold text-gray-900 text-lg">Чаты</h1>
          <Link
            href="/create"
            className="text-xs font-semibold text-green-600 flex items-center gap-1 hover:text-green-700 bg-green-50 px-3 py-1.5 rounded-full"
          >
            <Plus className="w-4 h-4" /> Создать группу
          </Link>
        </div>

        {/* Поиск */}
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по чатам и сообщениям"
            className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition"
          />
        </div>

        {/* Вкладки */}
        <div className="flex gap-2">
          {[
            { id: "all", label: "Все" },
            { id: "my", label: "Мои чаты" },
            { id: "unread", label: "Непрочитанные" },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition ${
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

      {/* Список чатов */}
      <div className="divide-y divide-gray-100">
        {filteredChats.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <p className="text-sm font-medium">Чатов не найдено</p>
          </div>
        ) : (
          filteredChats.map((chat) => (
            <Link
              key={chat.id}
              href={`/chats/${chat.id}`}
              className="flex items-center gap-3.5 px-4 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition"
            >
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 shadow-xs ${chat.avatarColor} text-white`}
              >
                {chat.icon}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 text-sm truncate">
                    {chat.name}
                  </h3>
                  <span className="text-[11px] text-gray-400 shrink-0 ml-2">
                    {chat.lastMessageTime}
                  </span>
                </div>

                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-gray-500 truncate pr-2">
                    {chat.lastMessage}
                  </p>
                  {chat.unreadCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-green-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                      {chat.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
