"use client";

import { useState, use } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, QrCode, X, Heart, ShieldCheck, Share2 } from "lucide-react";
import { useAppStore } from "@/stores/appStore";

export default function FundraiserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { donateToFundraiser, currentUser, posts } = useAppStore();
  const fundraiserPost = posts.find((post) => post.fundraiser?.id === id) || posts.find((post) => post.type === "fundraiser");
  const fundraiser = fundraiserPost?.fundraiser;
  const fundraiserId = fundraiser?.id || id;
  const currentAmount = fundraiser?.current_amount ?? 1250000;
  const targetAmount = fundraiser?.target_amount ?? 2000000;
  const progress = Math.min(100, (currentAmount / targetAmount) * 100);

  const [isDonateModalOpen, setIsDonateModalOpen] = useState(false);
  const [donateAmount, setDonateAmount] = useState("5000");
  const [isPaid, setIsPaid] = useState(false);

  const [payments, setPayments] = useState([
    { id: "1", name: "Мария Иванова", date: "15 мая 2026", amount: 5000, status: "Оплачено" },
    { id: "2", name: "Алексей Петров", date: "14 мая 2026", amount: 10000, status: "Оплачено" },
    { id: "3", name: "Кайрат Нурланов", date: "12 мая 2026", amount: 25000, status: "Оплачено" },
    { id: "4", name: "Анонимный житель", date: "10 мая 2026", amount: 15000, status: "Оплачено" },
  ]);

  const handleDonate = (e: React.FormEvent) => {
    e.preventDefault();
    const sum = parseInt(donateAmount) || 0;
    if (sum <= 0) return;

    donateToFundraiser(fundraiserId, sum);
    setPayments([
      {
        id: Date.now().toString(),
        name: currentUser.fullName,
        date: "Только что",
        amount: sum,
        status: "Оплачено",
      },
      ...payments,
    ]);

    setIsPaid(true);
    setTimeout(() => {
      setIsPaid(false);
      setIsDonateModalOpen(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <Link href="/hoa" className="text-gray-600 p-1 -ml-1 hover:text-gray-900 transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-bold text-gray-900 text-xs truncate max-w-[200px]">
            {fundraiserPost?.title || "Сбор на благоустройство двора"}
        </h1>
        <button className="text-gray-400 p-1 hover:text-gray-600">
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-6">
        {/* Баннер сбора */}
        <div className="space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-gray-500 uppercase tracking-wider text-[11px]">
              Активный сбор
            </span>
            <span className="px-2.5 py-0.5 bg-green-50 text-green-700 rounded-full font-bold text-[11px]">
              Осталось 12 дней
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">
              {currentAmount.toLocaleString("ru-RU")} ₸
            </h2>
            <span className="text-sm font-semibold text-gray-400">
              из {targetAmount.toLocaleString("ru-RU")} ₸
            </span>
          </div>

          {/* Прогресс бар */}
          <div className="space-y-1.5">
            <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-green-500 to-emerald-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-green-600">{progress.toFixed(1)}% собрано</span>
              <span className="text-gray-400">{Math.max(0, targetAmount - currentAmount).toLocaleString("ru-RU")} ₸ осталось</span>
            </div>
          </div>
        </div>

        {/* Описание */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            О сборе
          </h3>
          <p className="text-xs text-gray-700 leading-relaxed">
            Собираем средства на комплексное благоустройство двора: безопасное каучуковое покрытие детской площадки, озеленение (высадка 25 деревьев и кустарников) и установку 8 энергосберегающих парковых фонарей.
          </p>
        </div>

        {/* Отчеты и смета */}
        <div className="space-y-2.5">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Отчёты по сбору
          </h3>
          <p className="text-[11px] text-gray-400">Последний отчёт 15 мая</p>

          <div className="grid grid-cols-2 gap-2">
            <img
              src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&auto=format&fit=crop&q=80"
              alt="План"
              className="w-full h-28 rounded-2xl object-cover ring-1 ring-black/5"
            />
            <img
              src="https://images.unsplash.com/photo-1588880331179-bc9b93a8cb5e?w=400&auto=format&fit=crop&q=80"
              alt="План 2"
              className="w-full h-28 rounded-2xl object-cover ring-1 ring-black/5"
            />
          </div>
        </div>

        {/* История платежей */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            История платежей
          </h3>

          <div className="divide-y divide-gray-100 rounded-2xl border border-gray-100 overflow-hidden">
            {payments.map((p) => (
              <div key={p.id} className="p-3.5 flex items-center justify-between bg-white hover:bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-xs">
                    {p.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-xs">{p.name}</p>
                    <p className="text-[10px] text-gray-400">{p.date}</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-bold text-gray-900 text-xs">
                    {p.amount.toLocaleString("ru-RU")} ₸
                  </p>
                  <p className="text-[10px] font-semibold text-green-600 flex items-center justify-end gap-0.5">
                    <CheckCircle2 className="w-2.5 h-2.5" /> {p.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Фиксированная кнопка «Внести свой вклад» */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 bg-white/95 backdrop-blur-xl border-t border-gray-100">
        <button
          onClick={() => setIsDonateModalOpen(true)}
          className="w-full py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-green-600/30 active:scale-95 transition"
        >
          Внести свой вклад
        </button>
      </div>

      {/* Модалка оплаты через Kaspi QR */}
      {isDonateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-green-600" />
                <h3 className="font-bold text-gray-900 text-sm">Официальный сбор ОСИ</h3>
              </div>
              <button onClick={() => setIsDonateModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {isPaid ? (
              <div className="py-8 text-center space-y-2">
                <div className="w-14 h-14 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="font-bold text-gray-900 text-base">Оплата успешно принята!</h4>
                <p className="text-xs text-gray-500">Спасибо за ваш вклад в развитие ЖК!</p>
              </div>
            ) : (
              <form onSubmit={handleDonate} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Сумма взноса (тенге, ₸)
                  </label>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    {["2000", "5000", "10000"].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setDonateAmount(s)}
                        className={`py-2 rounded-xl text-xs font-bold border transition ${
                          donateAmount === s
                            ? "bg-green-50 border-green-600 text-green-700"
                            : "bg-gray-50 border-gray-200 text-gray-700"
                        }`}
                      >
                        {parseInt(s).toLocaleString("ru-RU")} ₸
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    value={donateAmount}
                    onChange={(e) => setDonateAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                {/* Kaspi QR заглушка */}
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center text-white shrink-0 font-black text-xs">
                    Kaspi
                  </div>
                  <div>
                    <p className="text-xs font-bold text-red-900">Оплата через Kaspi Pay</p>
                    <p className="text-[10px] text-red-600">Официальный расчетный счет ОСИ «Солнечный»</p>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-green-600 hover:bg-green-700 text-white font-bold text-sm rounded-xl shadow-md transition"
                >
                  Оплатить {parseInt(donateAmount || "0").toLocaleString("ru-RU")} ₸
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
