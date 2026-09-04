"use client";

import { useState, use, useEffect } from "react";
import Link from "next/link";
import NextImage from "next/image";
import { ArrowLeft, CheckCircle2, QrCode, X, Heart, ShieldCheck, Share2 } from "lucide-react";
import { useAppStore } from "@/stores/appStore";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { complexName } from "@/lib/appConfig";

export default function FundraiserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { donateToFundraiser, posts, currentUser } = useAppStore();
  const [renderedAt] = useState(() => Date.now());
  const fundraiserPost = posts.find((post) => post.fundraiser?.id === id);
  const fundraiser = fundraiserPost?.fundraiser;
  const fundraiserId = fundraiser?.id || id;
  const currentAmount = fundraiser?.current_amount ?? 0;
  const targetAmount = fundraiser?.target_amount ?? 0;
  const progress = Math.min(100, targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0);
  const remainingDays = fundraiser?.ends_at
    ? Math.max(0, Math.ceil((new Date(fundraiser.ends_at).getTime() - renderedAt) / 86_400_000))
    : null;

  const [isDonateModalOpen, setIsDonateModalOpen] = useState(false);
  const [donateAmount, setDonateAmount] = useState("5000");
  const [isPaid, setIsPaid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const [payments, setPayments] = useState<Array<{ id: string; name: string; date: string; amount: number; status: string }>>([]);

  useEffect(() => {
    if (!isSupabaseConfigured() || !fundraiser) return;
    void (async () => {
      const { data, error } = await (createClient() as any)
        .from("fundraiser_payments")
        .select("id, amount, confirmed_at, is_anonymous, user:profiles(full_name)")
        .eq("fundraiser_id", fundraiser.id)
        .order("confirmed_at", { ascending: false });
      if (error) return;
      setPayments((data || []).map((payment: any) => ({
        id: payment.id,
        name: payment.is_anonymous ? "Анонимный житель" : payment.user?.full_name || "Житель ЖК",
        date: new Date(payment.confirmed_at).toLocaleDateString("ru-RU"),
        amount: Number(payment.amount),
        status: "Оплачено",
      })));
    })();
  }, [fundraiser]);

  if (!fundraiserPost || !fundraiser) {
    return (
      <div className="min-h-screen bg-white p-6 flex flex-col items-center justify-center text-center gap-4">
        <p className="text-sm font-semibold text-gray-600">Сбор не найден</p>
        <Link href="/hoa" className="text-sm font-bold text-green-700">Вернуться назад</Link>
      </div>
    );
  }

  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault();
    const sum = parseInt(donateAmount) || 0;
    if (sum <= 0) return;

    setIsSubmitting(true);
    setPaymentError(null);
    try {
      await donateToFundraiser(fundraiserId, sum);
      setIsPaid(true);
      setTimeout(() => {
        setIsPaid(false);
        setIsDonateModalOpen(false);
      }, 1500);
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : "Не удалось сохранить платёж");
    } finally {
      setIsSubmitting(false);
    }
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
              {remainingDays === null ? "Срок не указан" : `Осталось ${remainingDays} дн.`}
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
            {fundraiserPost?.content || "Описание сбора пока не добавлено."}
          </p>
        </div>

        {/* Отчеты и смета */}
        <div className="space-y-2.5">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Отчёты по сбору
          </h3>
          <p className="text-[11px] text-gray-400">Документы и отчёты появятся здесь после публикации.</p>

          {fundraiserPost?.attachments?.length ? (
            <div className="grid grid-cols-2 gap-2">
              {fundraiserPost.attachments.slice(0, 2).map((attachment) => (
                <NextImage key={attachment.id} src={attachment.url} alt="Документ по сбору" width={600} height={320} sizes="(max-width: 640px) 50vw, 320px" unoptimized className="w-full h-28 rounded-2xl object-cover ring-1 ring-black/5" />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-6 text-center text-xs text-gray-400">Файлы ещё не прикреплены</div>
          )}
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

      {/* Платежи пока не подключаем: сбор и история доступны для просмотра. */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 bg-white/95 backdrop-blur-xl border-t border-gray-100">
        <button
          type="button"
          disabled
          className="w-full py-3.5 bg-gray-100 text-gray-500 font-bold text-sm rounded-2xl cursor-not-allowed"
        >
          Оплата будет подключена позже
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

                {paymentError && <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{paymentError}</p>}
                {/* Внешний платёжный провайдер подключается отдельно; запись взноса проходит через защищённый RPC. */}
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center text-white shrink-0 font-black text-xs">
                    Kaspi
                  </div>
                  <div>
                    <p className="text-xs font-bold text-red-900">Оплата через Kaspi Pay</p>
                    <p className="text-[10px] text-red-600">Официальный расчётный счёт ОСИ «{complexName(currentUser.complexName)}»</p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !fundraiser}
                  className="w-full py-3.5 bg-green-600 hover:bg-green-700 text-white font-bold text-sm rounded-xl shadow-md transition"
                >
                  {isSubmitting ? "Сохраняем…" : `Оплатить ${parseInt(donateAmount || "0").toLocaleString("ru-RU")} ₸`}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
