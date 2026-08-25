"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Phone, 
  MessageSquare, 
  ShieldCheck, 
  MapPin, 
  Share2, 
  Building2,
  Clock
} from "lucide-react";
import { useAppStore } from "@/stores/appStore";

export default function ClassifiedDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { classifieds, createDirectChatWith } = useAppStore();

  const item = classifieds.find((c) => c.id === resolvedParams.id) || classifieds[0];

  const handleStartChat = () => {
    const chatId = createDirectChatWith(item.authorName);
    router.push(`/chats/${chatId}`);
  };

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-gray-100 px-6 py-3.5 flex items-center justify-between shadow-xs">
        <Link href="/classifieds" className="text-gray-600 p-1 -ml-1 hover:text-gray-900 transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-bold text-gray-900 text-sm truncate max-w-[200px]">{item.title}</h1>
        <button className="text-gray-400 p-1 hover:text-gray-600">
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      <div className="p-6 space-y-6">
        {/* Фото */}
        <div className="rounded-3xl overflow-hidden shadow-sm max-h-80 bg-gray-100">
          <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
        </div>

        {/* Цена и заголовок */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full font-bold text-xs">
              {item.category}
            </span>
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> {item.createdAt}
            </span>
          </div>

          <h2 className="text-xl font-black text-gray-900 tracking-tight">{item.title}</h2>
          <p className="text-2xl font-black text-green-700">{item.price}</p>
        </div>

        {/* Описание */}
        <div className="space-y-2 pt-2 border-t border-gray-100">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Описание</h3>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
            {item.description}
          </p>
        </div>

        {/* Карточка автора */}
        <div className="p-4 rounded-3xl bg-gray-50 border border-gray-200/80 space-y-3">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Контакты жителя</h3>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-green-100 text-green-800 font-black flex items-center justify-center text-sm shadow-xs">
              {item.authorName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="font-bold text-gray-900 text-sm">{item.authorName}</p>
                <ShieldCheck className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-xs text-gray-500">{item.location}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Фиксированный бар действий */}
      <div className="fixed bottom-0 left-0 right-0 max-w-2xl mx-auto bg-white/95 backdrop-blur-xl border-t border-gray-200 p-4 flex gap-3 z-30">
        <a
          href={`tel:${item.authorPhone}`}
          className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold text-xs rounded-2xl flex items-center justify-center gap-2 transition"
        >
          <Phone className="w-4 h-4 text-green-600" />
          <span>Позвонить</span>
        </a>

        <button
          onClick={handleStartChat}
          className="flex-1 py-3.5 bg-green-600 hover:bg-green-700 active:scale-95 text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-green-600/30 transition"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Написать в чат</span>
        </button>
      </div>
    </div>
  );
}
