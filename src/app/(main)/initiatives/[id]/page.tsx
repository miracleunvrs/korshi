"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Circle, Clock, MessageSquare, ThumbsUp, ShieldCheck } from "lucide-react";

export default function InitiativeDetailPage() {
  const [supported, setSupported] = useState(false);
  const [supportCount, setSupportCount] = useState(24);

  const stages = [
    { title: "Предложение", desc: "15 мая • Алексей Петров", completed: true },
    { title: "На рассмотрении у ОСИ", desc: "Изучение сметы и технических условий", current: true },
    { title: "Голосование жителей", desc: "Требуется поддержка 60% жителей подъезда", completed: false },
    { title: "Реализация", desc: "Установка оборудования и приёмка работ", completed: false },
  ];

  const handleSupport = () => {
    if (!supported) {
      setSupported(true);
      setSupportCount(supportCount + 1);
    } else {
      setSupported(false);
      setSupportCount(supportCount - 1);
    }
  };

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <Link href="/feed" className="text-gray-600 p-1 -ml-1">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-semibold text-gray-900 text-sm">Инициатива</h1>
        <div className="w-5" />
      </div>

      <div className="p-4 space-y-5">
        {/* Заголовок и автор */}
        <div>
          <div className="inline-block px-2.5 py-0.5 bg-green-50 text-green-700 text-xs font-semibold rounded-full mb-2">
            На рассмотрении
          </div>
          <h2 className="text-lg font-bold text-gray-900 leading-snug">
            Установка камеры видеонаблюдения в подъезде 2
          </h2>

          <div className="flex items-center gap-3 mt-3">
            <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center font-medium text-green-800 text-xs">
              АП
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-900">Алексей Петров</p>
              <p className="text-[11px] text-gray-400">Подъезд 2 • Собственник</p>
            </div>
          </div>
        </div>

        {/* Описание */}
        <div className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-2xl">
          Предлагаю установить современную камеру видеонаблюдения на первом этаже подъезда 2 для повышения безопасности жителей, сохранности колясок и велосипедов.
        </div>

        {/* Таймлайн этапов */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Этапы инициативы
          </h3>

          <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gray-100">
            {stages.map((stage, idx) => (
              <div key={idx} className="relative flex items-start gap-3 pl-1">
                {stage.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 bg-white relative z-10 shrink-0" />
                ) : stage.current ? (
                  <div className="w-5 h-5 rounded-full border-2 border-green-600 bg-white flex items-center justify-center relative z-10 shrink-0">
                    <div className="w-2 h-2 rounded-full bg-green-600" />
                  </div>
                ) : (
                  <Circle className="w-5 h-5 text-gray-300 bg-white relative z-10 shrink-0" />
                )}
                <div>
                  <p className={`text-xs font-semibold leading-tight ${stage.current ? "text-green-700" : stage.completed ? "text-gray-900" : "text-gray-400"}`}>
                    {stage.title}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{stage.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Статистика */}
        <div className="flex items-center justify-between py-3 border-y border-gray-100 text-xs text-gray-500">
          <span>Поддержали: <strong className="text-gray-900">{supportCount}</strong></span>
          <span>Комментарии: <strong className="text-gray-900">8</strong></span>
        </div>
      </div>

      {/* Фиксированная кнопка внизу */}
      <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto p-4 bg-white/95 backdrop-blur-md border-t border-gray-100">
        <button
          onClick={handleSupport}
          className={`w-full py-3.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition ${
            supported
              ? "bg-green-100 text-green-800"
              : "bg-green-600 text-white shadow-md hover:bg-green-700"
          }`}
        >
          <ThumbsUp className="w-4 h-4" />
          <span>{supported ? "Вы поддержали инициативу" : "Поддержать инициативу"}</span>
        </button>
      </div>
    </div>
  );
}
