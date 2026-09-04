"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Globe2, LoaderCircle, Palette, PlugZap, Save, Settings2, ShieldCheck } from "lucide-react";
import { useAppStore } from "@/stores/appStore";
import { useOperationsStore, type ComplexSettings } from "@/stores/operationsStore";

const integrations = [
  { name: "Web / Flutter Push", env: "ONESIGNAL_APP_ID + REST API key", status: "not_configured" },
  { name: "Критичные SMS", env: "SMS_PROVIDER_URL + SMS_PROVIDER_KEY", status: "not_configured" },
  { name: "Платёжный провайдер", env: "PAYMENT_PROVIDER_URL + webhook secret", status: "not_configured" },
  { name: "Домофон / СКУД", env: "ACCESS_CONTROL_URL + API key", status: "not_configured" },
  { name: "Шлагбаум", env: "BARRIER_PROVIDER_URL + API key", status: "not_configured" },
  { name: "ЭЦП / eGov", env: "NCALayer / eGov credentials", status: "not_configured" },
  { name: "Korshi AI", env: "OPENAI_API_KEY + OPENAI_MODEL", status: "not_configured" },
] as const;

export default function ComplexSettingsPage() {
  const currentUser = useAppStore((state) => state.currentUser);
  const saved = useOperationsStore((state) => state.complexSettings);
  const update = useOperationsStore((state) => state.updateComplexSettings);
  const [form, setForm] = useState<ComplexSettings>(saved);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!["admin", "hoa_official"].includes(currentUser.role)) return <div className="grid min-h-screen place-items-center p-6 text-center"><div><ShieldCheck className="mx-auto h-10 w-10 text-stone-300" /><p className="mt-3 text-sm font-bold">Доступ только для управления ЖК</p><Link href="/feed" className="mt-3 inline-block text-sm font-extrabold text-green-800">Вернуться</Link></div></div>;

  const submit = async (event: FormEvent) => { event.preventDefault(); setBusy(true); await update(form); setBusy(false); setSuccess(true); };
  const updateList = (key: "requestCategories" | "customRoles", raw: string) => setForm((state) => ({ ...state, [key]: raw.split("\n").map((item) => item.trim()).filter(Boolean) }));

  return <div className="min-h-screen bg-[#f8f7f2] pb-10"><header className="border-b border-stone-200/80 px-4 py-5 sm:px-6"><Link href="/admin" className="inline-flex min-h-10 items-center gap-2 text-xs font-extrabold text-stone-600"><ArrowLeft className="h-4 w-4" />Назад в управление</Link><div className="mt-3 flex items-start gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-stone-900 text-white"><Settings2 className="h-5 w-5" /></span><div><p className="text-xs font-extrabold uppercase tracking-[.14em] text-green-800">White-label</p><h1 className="mt-1 text-2xl font-black">Настройки ЖК</h1><p className="mt-1 text-sm text-stone-600">Бренд, роли, правила, локализация и подключения.</p></div></div></header><main className="space-y-5 px-4 py-5 sm:px-6"><form onSubmit={submit} className="space-y-5">
    <section className="rounded-[28px] border border-stone-200 bg-white p-5"><h2 className="flex items-center gap-2 text-sm font-black"><Palette className="h-4 w-4 text-violet-700" />Бренд и контакты</h2><div className="mt-4 grid gap-4 sm:grid-cols-2"><Field label="Название ЖК"><input className="field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field><Field label="Логотип (URL)"><input className="field" value={form.logoUrl} onChange={(e) => setForm({ ...form, logoUrl: e.target.value })} placeholder="https://..." /></Field><Field label="Основной цвет"><div className="mt-2 flex gap-2"><input type="color" value={form.primaryColor} onChange={(e) => setForm({ ...form, primaryColor: e.target.value })} className="h-12 w-14 rounded-xl border border-stone-200 bg-white p-1" /><input className="field mt-0" value={form.primaryColor} onChange={(e) => setForm({ ...form, primaryColor: e.target.value })} /></div></Field><Field label="Собственный домен"><input className="field" value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })} /></Field><Field label="Телефон управления"><input className="field" value={form.managementPhone} onChange={(e) => setForm({ ...form, managementPhone: e.target.value })} /></Field><Field label="Email управления"><input className="field" type="email" value={form.managementEmail} onChange={(e) => setForm({ ...form, managementEmail: e.target.value })} /></Field></div><label className="mt-4 flex cursor-pointer items-center justify-between rounded-2xl bg-stone-50 p-4"><span><span className="block text-xs font-extrabold">White-label приложение</span><span className="mt-1 block text-[10px] text-stone-500">Скрыть бренд Korshi и использовать собственный</span></span><input type="checkbox" checked={form.whiteLabel} onChange={(e) => setForm({ ...form, whiteLabel: e.target.checked })} className="h-5 w-5 accent-green-700" /></label></section>
    <section className="rounded-[28px] border border-stone-200 bg-white p-5"><h2 className="flex items-center gap-2 text-sm font-black"><Globe2 className="h-4 w-4 text-green-800" />Локализация и структура</h2><div className="mt-4 flex gap-2">{(["ru", "kk", "en"] as const).map((lang) => <button type="button" key={lang} onClick={() => setForm({ ...form, languages: form.languages.includes(lang) ? form.languages.filter((item) => item !== lang) : [...form.languages, lang] })} className={`min-h-10 rounded-xl px-4 text-xs font-extrabold uppercase ${form.languages.includes(lang) ? "bg-green-800 text-white" : "bg-stone-100 text-stone-600"}`}>{lang}</button>)}</div><div className="mt-4 grid gap-4 sm:grid-cols-2"><Field label="Категории заявок, по одной в строке"><textarea rows={6} className="field py-3" value={form.requestCategories.join("\n")} onChange={(e) => updateList("requestCategories", e.target.value)} /></Field><Field label="Роли ЖК, по одной в строке"><textarea rows={6} className="field py-3" value={form.customRoles.join("\n")} onChange={(e) => updateList("customRoles", e.target.value)} /></Field></div><Field label="Правила дома"><textarea rows={5} className="field py-3" value={form.houseRules} onChange={(e) => setForm({ ...form, houseRules: e.target.value })} /></Field></section>
    <button disabled={busy} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-green-800 text-sm font-extrabold text-white disabled:opacity-50">{busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Сохранить настройки</button>{success && <p role="status" className="flex items-center gap-2 rounded-2xl bg-emerald-50 p-3 text-xs font-bold text-emerald-900"><CheckCircle2 className="h-4 w-4" />Настройки сохранены</p>}
  </form><section className="rounded-[28px] border border-stone-200 bg-white p-5"><h2 className="flex items-center gap-2 text-sm font-black"><PlugZap className="h-4 w-4 text-amber-700" />Внешние интеграции</h2><div className="mt-4 divide-y divide-stone-100">{integrations.map((item) => <div key={item.name} className="flex items-center justify-between gap-4 py-3"><div><p className="text-xs font-extrabold text-stone-900">{item.name}</p><p className="mt-1 font-mono text-[9px] text-stone-500">{item.env}</p></div><span className="shrink-0 rounded-full bg-amber-100 px-2 py-1 text-[9px] font-extrabold text-amber-900">Не настроено</span></div>)}</div><p className="mt-3 text-[10px] leading-4 text-stone-500">Секреты задаются только в серверном окружении. Интерфейс намеренно не принимает ключи в браузере.</p></section></main></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block text-xs font-extrabold text-stone-800">{label}{children}</label>; }
