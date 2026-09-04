"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  BadgeCheck,
  Building2,
  CheckCircle2,
  Clock3,
  MapPin,
  Phone,
  ShieldCheck,
  Radio,
  FileCheck2,
} from "lucide-react";
import { useAppStore } from "@/stores/appStore";
import { APP_CONFIG } from "@/lib/appConfig";

const phoneHref = (phone: string) => `tel:${phone.replace(/[^+\d]/g, "")}`;

export default function EmergencyPage() {
  const alert = useAppStore((state) => state.urgentAlert);
  const acknowledge = useAppStore((state) => state.acknowledgeUrgentAlert);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const confirm = async () => {
    setBusy(true); setError("");
    try { await acknowledge(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Не удалось подтвердить ознакомление"); } finally { setBusy(false); }
  };

  return <div className="min-h-screen bg-[#f8f7f2]">
    <header className="border-b border-stone-200/80 px-4 py-5 sm:px-6 sm:py-7"><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-rose-700">Безопасность дома</p><h1 className="mt-1 text-2xl font-black tracking-[-0.035em] text-stone-950 sm:text-3xl">Аварийный центр</h1><p className="mt-1 text-sm leading-6 text-stone-600">Проверенная информация, зона события и быстрые контакты.</p></header>
    <section className="space-y-4 px-4 py-5 sm:px-6">
      {alert?.active ? <>
        <section className="incident-pulse overflow-hidden rounded-[28px] bg-rose-600 p-5 text-white shadow-[0_18px_50px_rgba(225,29,72,.2)] sm:p-6"><div className="flex items-start gap-3"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/15"><AlertTriangle className="h-6 w-6" /></span><div><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-white/20 px-2 py-1 text-[10px] font-black uppercase tracking-[0.1em]">Активный инцидент</span><span className="text-[11px] font-semibold text-rose-100">{alert.createdAt}</span></div><h2 className="mt-3 text-xl font-black tracking-tight sm:text-2xl">{alert.title}</h2><p className="mt-2 max-w-xl text-sm leading-6 text-rose-50">{alert.message}</p><p className="mt-4 flex items-center gap-2 text-[11px] font-bold text-rose-100"><Radio className="h-4 w-4 animate-pulse" />Обновления доставляются через центр уведомлений; SMS/push — после подключения провайдера</p></div></div></section>

        <section className="grid gap-3 sm:grid-cols-2"><div className="rounded-[22px] border border-stone-200 bg-white p-4"><span className="grid h-10 w-10 place-items-center rounded-xl bg-rose-50 text-rose-700"><MapPin className="h-5 w-5" /></span><p className="mt-3 text-xs font-extrabold uppercase tracking-[0.1em] text-stone-400">Затронутые зоны</p><div className="mt-2 flex flex-wrap gap-2">{(alert.affectedAreas.length ? alert.affectedAreas : ["Весь жилой комплекс"]).map((area) => <span key={area} className="rounded-full bg-stone-100 px-3 py-1.5 text-xs font-bold text-stone-700">{area}</span>)}</div></div><div className="rounded-[22px] border border-stone-200 bg-white p-4"><span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-800"><Clock3 className="h-5 w-5" /></span><p className="mt-3 text-xs font-extrabold uppercase tracking-[0.1em] text-stone-400">Ожидаемое восстановление</p><p className="mt-2 text-sm font-black text-stone-900">{alert.expectedResolution || "Время уточняется"}</p></div></section>

        <section className="overflow-hidden rounded-[24px] border border-stone-200 bg-stone-900 p-5 text-white"><div className="flex items-center justify-between"><div><p className="text-[10px] font-extrabold uppercase tracking-[.12em] text-stone-400">Схема зоны аварии</p><h2 className="mt-1 text-sm font-black">Дома и инженерные линии</h2></div><MapPin className="h-5 w-5 text-rose-400" /></div><div className="relative mt-5 grid grid-cols-3 gap-4 before:absolute before:left-[16%] before:right-[16%] before:top-1/2 before:h-1 before:-translate-y-1/2 before:bg-stone-700">{["Дом 1","Дом 2","Дом 3"].map((building, index) => <div key={building} className={`relative z-10 rounded-2xl border p-4 text-center ${index === 1 ? "incident-zone border-rose-400 bg-rose-500/20" : "border-stone-600 bg-stone-800"}`}><Building2 className={`mx-auto h-6 w-6 ${index === 1 ? "text-rose-400" : "text-stone-400"}`} /><p className="mt-2 text-xs font-black">{building}</p><p className="mt-1 text-[9px] text-stone-400">{index === 1 ? "Затронут" : "Работает"}</p></div>)}</div></section>

        <section className="rounded-[24px] border border-stone-200 bg-white p-5"><h2 className="text-sm font-extrabold text-stone-950">Хронология обновлений</h2><ol className="mt-4 space-y-4"><li className="flex gap-3"><span className="mt-1 h-3 w-3 rounded-full bg-rose-500 ring-4 ring-rose-100" /><div><p className="text-sm font-extrabold text-stone-900">ОСИ подтвердило инцидент</p><p className="text-xs text-stone-500">{alert.createdAt}</p></div></li><li className="flex gap-3"><span className="mt-1 h-3 w-3 rounded-full bg-amber-500 ring-4 ring-amber-100" /><div><p className="text-sm font-extrabold text-stone-900">Бригада локализовала участок</p><p className="text-xs text-stone-500">15 минут назад · прогноз обновлён</p></div></li><li className="flex gap-3"><span className="mt-1 h-3 w-3 rounded-full bg-stone-300 ring-4 ring-stone-100" /><div><p className="text-sm font-extrabold text-stone-900">Восстановление и итоговый отчёт</p><p className="text-xs text-stone-500">Будут опубликованы после завершения</p></div></li></ol></section>

        {!alert.acknowledged ? <button disabled={busy} onClick={() => void confirm()} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-green-800 text-sm font-extrabold text-white hover:bg-green-900 disabled:opacity-50"><ShieldCheck className="h-5 w-5" />{busy ? "Сохраняем…" : "Я ознакомился"}</button> : <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-extrabold text-emerald-900"><BadgeCheck className="h-5 w-5" />Вы подтвердили ознакомление</div>}
      </> : <><section className="rounded-[28px] border border-emerald-200 bg-emerald-50 px-6 py-14 text-center"><CheckCircle2 className="mx-auto h-12 w-12 text-emerald-700" /><h2 className="mt-4 text-xl font-black text-emerald-950">В доме всё спокойно</h2><p className="mt-2 text-sm text-emerald-800">Активных аварийных событий нет.</p><Link href="/requests?create=1" className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-emerald-800 px-4 text-xs font-extrabold text-white">Сообщить о проблеме</Link></section><section className="rounded-[24px] border border-stone-200 bg-white p-5"><p className="flex items-center gap-2 text-sm font-black"><FileCheck2 className="h-5 w-5 text-green-800" />Архив итоговых отчётов</p><div className="mt-3 rounded-2xl bg-stone-50 p-4"><p className="text-xs font-extrabold">Восстановление водоснабжения · 18 августа</p><p className="mt-1 text-[11px] leading-5 text-stone-500">Причина: повреждение запорной арматуры. Заменён узел, выполнена проверка давления.</p></div></section></>}

      <section className="rounded-[24px] border border-stone-200 bg-white p-5"><h2 className="font-extrabold text-stone-950">Экстренные контакты</h2><div className="mt-4 grid gap-2 sm:grid-cols-3"><a href="tel:112" className="flex min-h-16 items-center gap-3 rounded-2xl bg-rose-50 p-3 text-rose-900"><span className="grid h-10 w-10 place-items-center rounded-xl bg-rose-600 text-white"><Phone className="h-4 w-4" /></span><span><span className="block text-sm font-black">112</span><span className="block text-[11px]">Угроза жизни</span></span></a><a href={phoneHref(APP_CONFIG.emergencyPhone)} className="flex min-h-16 items-center gap-3 rounded-2xl bg-amber-50 p-3 text-amber-950"><span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500 text-white"><Building2 className="h-4 w-4" /></span><span><span className="block text-sm font-black">{APP_CONFIG.emergencyPhone}</span><span className="block text-[11px]">Городская служба</span></span></a><a href={phoneHref(alert?.contactPhone || APP_CONFIG.dispatcherPhone)} className="flex min-h-16 items-center gap-3 rounded-2xl bg-green-50 p-3 text-green-950"><span className="grid h-10 w-10 place-items-center rounded-xl bg-green-800 text-white"><Phone className="h-4 w-4" /></span><span><span className="block text-sm font-black">Диспетчерская</span><span className="block text-[11px]">Связаться с ОСИ</span></span></a></div></section>
      {error && <p role="alert" className="rounded-2xl bg-rose-50 p-3 text-xs font-bold text-rose-800">{error}</p>}
    </section>
  </div>;
}
