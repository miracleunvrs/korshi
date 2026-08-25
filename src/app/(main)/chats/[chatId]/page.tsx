"use client";

import { useState, useRef, useEffect, use } from "react";
import Link from "next/link";
import { ArrowLeft, Send, Paperclip, MoreVertical, ShieldCheck, CheckCheck } from "lucide-react";
import { useAppStore } from "@/stores/appStore";

export default function ChatRoomPage({ params }: { params: Promise<{ chatId: string }> }) {
  const resolvedParams = use(params);
  const chatId = resolvedParams.chatId;

  const { chats, messages, sendMessage, deleteMessage, currentUser } = useAppStore();
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentChat = chats.find((c) => c.id === chatId) || {
    id: chatId,
    name: "Чат сообщества",
    icon: "💬",
  };

  const chatMessages = messages[chatId] || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    sendMessage(chatId, inputText.trim());
    setInputText("");
  };

  return (
    <div className="flex flex-col h-screen bg-[#f4f5f7]">
      {/* Chat header */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <Link href="/chats" className="text-gray-600 p-1 -ml-1 hover:text-gray-900 transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="font-bold text-gray-900 text-sm leading-tight">
              {currentChat.name}
            </h2>
            <p className="text-[11px] text-green-600 font-medium flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Онлайн в ЖК
            </p>
          </div>
        </div>
        <button className="text-gray-400 p-1.5 hover:bg-gray-100 rounded-full transition">
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>

      {/* Message stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {chatMessages.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-xs">
            Сообщений пока нет. Напишите первым!
          </div>
        ) : (
          chatMessages.map((m) => {
            const isMe = m.isMe || m.senderName === currentUser.fullName;
            return (
              <div
                key={m.id}
                className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
              >
                {!isMe && (
                  <span className="text-[11px] font-medium text-gray-500 mb-1 flex items-center gap-1 ml-1">
                    {m.senderName}
                    {m.isOfficial && (
                      <ShieldCheck className="w-3.5 h-3.5 text-green-600 inline" />
                    )}
                  </span>
                )}
                <div
                  className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-sm transition ${
                    isMe
                      ? "bg-green-600 text-white rounded-br-xs"
                      : "bg-white text-gray-800 border border-gray-100 rounded-bl-xs"
                  }`}
                >
                  <div className="flex items-end gap-2">
                    <p className="whitespace-pre-line">{m.text}</p>
                    {isMe && m.senderId === currentUser.id && (
                      <button
                        type="button"
                        onClick={() => deleteMessage(chatId, m.id)}
                        className="text-[9px] text-green-100/80 hover:text-white"
                      >
                        Удалить
                      </button>
                    )}
                  </div>
                  <div
                    className={`flex items-center justify-end gap-1 text-[10px] mt-1 ${
                      isMe ? "text-green-100" : "text-gray-400"
                    }`}
                  >
                    <span>{m.time}</span>
                    {isMe && <CheckCheck className="w-3 h-3" />}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <form
        onSubmit={handleSend}
        className="bg-white border-t border-gray-100 p-3 flex items-center gap-2 max-w-lg mx-auto w-full"
      >
        <button
          type="button"
          className="text-gray-400 p-2 hover:text-gray-600 hover:bg-gray-100 rounded-full transition"
          aria-label="Прикрепить"
        >
          <Paperclip className="w-5 h-5" />
        </button>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Написать сообщение соседям..."
          className="flex-1 px-4 py-2.5 bg-gray-100 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="w-10 h-10 bg-green-600 text-white rounded-2xl flex items-center justify-center disabled:opacity-40 hover:bg-green-700 shadow-md shadow-green-600/20 active:scale-95 transition shrink-0"
        >
          <Send className="w-4 h-4 ml-0.5" />
        </button>
      </form>
    </div>
  );
}
