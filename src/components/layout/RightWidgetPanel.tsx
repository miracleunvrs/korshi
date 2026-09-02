"use client";

import Link from "next/link";
import { 
  Building2, 
  ShieldCheck, 
  PhoneCall, 
  Coins, 
  BarChart3, 
  ArrowRight,
  Users
} from "lucide-react";

export default function RightWidgetPanel() {
  return (
    <aside className="w-80 shrink-0 hidden lg:flex flex-col gap-4 p-4 sticky top-0 h-screen overflow-y-auto scrollbar-hide">
      {/* Виджет ОСИ и контакты */}
      <div className="p-4 bg-white rounded-3xl border border-gray-200/80 shadow-xs space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-green-600 text-white flex items-center justify-center shadow-sm">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <h3 className="font-bold text-gray-900 text-xs">ОСИ «Солнечный»</h3>
              <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
            </div>
            <p className="text-[11px] text-green-600 font-medium">Управление на связи</p>
          </div>
        </div>

        <div className="space-y-1.5 pt-1 text-xs">
          <a
            href="tel:+77271234567"
            className="flex items-center justify-between p-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 transition"
          >
            <span className="text-[11px] font-semibold text-gray-500">Аварийная служба:</span>
            <span className="font-bold text-gray-900 flex items-center gap-1">
              <PhoneCall className="w-3 h-3 text-red-500" /> 109
            </span>
          </a>
          <a
            href="tel:+77771234567"
            className="flex items-center justify-between p-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 transition"
          >
            <span className="text-[11px] font-semibold text-gray-500">Диспетчер ЖК:</span>
            <span className="font-bold text-gray-900">+7 (777) 123-45-67</span>
          </a>
        </div>
      </div>

      {/* Виджет активного сбора */}
      <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50/50 rounded-3xl border border-green-200/60 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-green-900">
            <Coins className="w-4 h-4 text-green-700" />
            <span>Активный сбор ЖК</span>
          </div>
          <span className="px-2 py-0.5 bg-green-100 text-green-800 text-[10px] font-bold rounded-full">
            62%
          </span>
        </div>

        <div>
          <h4 className="font-bold text-gray-900 text-xs leading-snug">
            Благоустройство двора и новая детская площадка
          </h4>
          <p className="text-[11px] text-gray-500 mt-1">
            Собрано <strong className="text-gray-900 font-bold">1 250 000 ₸</strong> из 2 млн ₸
          </p>
        </div>

        <div className="w-full bg-green-200/60 h-2 rounded-full overflow-hidden">
          <div className="bg-green-600 h-full rounded-full" style={{ width: "62%" }} />
        </div>

        <Link
          href="/hoa/fundraisers/fund-1"
          className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition"
        >
          Внести вклад <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Виджет активного опроса */}
      <div className="p-4 bg-white rounded-3xl border border-gray-200/80 shadow-xs space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900">
          <BarChart3 className="w-4 h-4 text-green-600" />
          <span>Голосование до 25 мая</span>
        </div>

        <h4 className="font-bold text-gray-900 text-xs leading-snug">
          Какой проект благоустройства двора вам больше нравится?
        </h4>

        <div className="space-y-1.5 text-xs">
          <div className="p-2 bg-gray-50 rounded-xl text-[11px] text-gray-700 flex justify-between">
            <span>Детская эко-площадка</span>
            <strong className="text-green-700">62%</strong>
          </div>
          <div className="p-2 bg-gray-50 rounded-xl text-[11px] text-gray-700 flex justify-between">
            <span>Зона воркаута и спорт</span>
            <strong className="text-gray-500">26%</strong>
          </div>
        </div>

        <Link
          href="/feed"
          className="block text-center text-xs font-bold text-green-600 hover:text-green-700 pt-1"
        >
          Участвовать в опросе →
        </Link>
      </div>

      {/* Соседи в сети */}
      <div className="p-4 bg-white rounded-3xl border border-gray-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-gray-900 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-green-600" /> Соседи онлайн
          </span>
          <span className="text-[11px] text-green-600 font-bold">48 в сети</span>
        </div>

        <div className="flex items-center -space-x-2 overflow-hidden py-1">
          {["МИ", "АП", "КН", "ОС", "АН", "СМ"].map((initials, idx) => (
            <div
              key={idx}
              className="inline-flex items-center justify-center w-8 h-8 rounded-full ring-2 ring-white bg-green-100 text-green-800 text-[10px] font-bold"
            >
              {initials}
            </div>
          ))}
          <div className="inline-flex items-center justify-center w-8 h-8 rounded-full ring-2 ring-white bg-gray-100 text-gray-600 text-[10px] font-bold">
            +42
          </div>
        </div>
      </div>
    </aside>
  );
}
