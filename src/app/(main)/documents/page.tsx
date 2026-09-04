"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import {
  Archive,
  BadgeCheck,
  CheckCircle2,
  Download,
  FileBarChart,
  FileCheck2,
  FileClock,
  FileText,
  FolderOpen,
  LoaderCircle,
  Plus,
  Search,
  ShieldCheck,
  Upload,
  X,
} from "lucide-react";
import { useAppStore, type HouseDocument, type HouseDocumentCategory } from "@/stores/appStore";
import NextImage from "next/image";
import { HOUSE_DOCUMENT_UPLOAD_TYPES, validateUploadFile } from "@/lib/uploadLimits";

const categories: Array<{ id: "all" | HouseDocumentCategory; label: string }> = [
  { id: "all", label: "Все" },
  { id: "finance", label: "Финансы" },
  { id: "protocol", label: "Протоколы" },
  { id: "rules", label: "Правила" },
  { id: "contract", label: "Договоры" },
  { id: "notice", label: "Уведомления" },
  { id: "report", label: "Отчёты" },
];

const categoryLabel: Record<HouseDocumentCategory, string> = {
  finance: "Финансы",
  protocol: "Протокол",
  rules: "Правила",
  contract: "Договор",
  notice: "Уведомление",
  report: "Отчёт",
  other: "Документ",
};

const formatBytes = (bytes: number) => bytes >= 1024 * 1024
  ? `${(bytes / 1024 / 1024).toFixed(1)} МБ`
  : `${Math.max(1, Math.round(bytes / 1024))} КБ`;

function DocumentCard({ document, canManage, onPreview }: { document: HouseDocument; canManage: boolean; onPreview: () => void }) {
  const acknowledge = useAppStore((state) => state.acknowledgeDocument);
  const archiveDocument = useAppStore((state) => state.archiveDocument);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const run = async (action: () => Promise<void>) => {
    setBusy(true); setError("");
    try { await action(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Не удалось обновить документ"); } finally { setBusy(false); }
  };

  return <article className="reveal-up overflow-hidden rounded-[24px] border border-stone-200 bg-white shadow-[0_10px_32px_rgba(41,37,36,.045)]">
    <div className="p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${document.isImportant ? "bg-violet-100 text-violet-800" : "bg-stone-100 text-green-800"}`}><FileText className="h-5 w-5" /></span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5"><span className="rounded-full bg-stone-100 px-2 py-1 text-[10px] font-extrabold text-stone-600">{categoryLabel[document.category]}</span>{document.isImportant && <span className="rounded-full bg-violet-100 px-2 py-1 text-[10px] font-extrabold text-violet-800">Важно</span>}{document.requiresAcknowledgement && !document.acknowledged && <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-extrabold text-amber-900">Нужно ознакомиться</span>}{document.acknowledged && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-extrabold text-emerald-800"><BadgeCheck className="h-3 w-3" />Ознакомлен</span>}</div>
          <h2 className="mt-2 text-base font-extrabold text-stone-950">{document.title}</h2>
          <p className="mt-1 text-sm leading-6 text-stone-600">{document.description}</p>
          <p className="mt-3 text-[11px] font-semibold text-stone-400">Версия {document.version} · {formatBytes(document.sizeBytes)} · {document.scopeLabel || "Весь ЖК"} · {document.publishedAt}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={onPreview} className="min-h-11 flex-1 rounded-xl bg-stone-100 px-4 text-xs font-extrabold text-stone-800 transition hover:bg-stone-200">Подробнее</button>
        {document.url && <a href={document.url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-green-800 px-4 text-xs font-extrabold text-white hover:bg-green-900"><Download className="h-4 w-4" />Открыть файл</a>}
        {document.requiresAcknowledgement && !document.acknowledged && <button disabled={busy} onClick={() => void run(() => acknowledge(document.id))} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-violet-700 px-4 text-xs font-extrabold text-white hover:bg-violet-800 disabled:opacity-50"><FileCheck2 className="h-4 w-4" />Подтвердить ознакомление</button>}
        {canManage && document.status === "active" && <button disabled={busy} onClick={() => void run(() => archiveDocument(document.id))} className="grid h-11 w-11 place-items-center rounded-xl text-stone-500 hover:bg-stone-100" aria-label="Переместить документ в архив"><Archive className="h-4 w-4" /></button>}
      </div>
      {error && <p role="alert" className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-800">{error}</p>}
    </div>
  </article>;
}

export default function DocumentsPage() {
  const documents = useAppStore((state) => state.documents);
  const addDocument = useAppStore((state) => state.addHouseDocument);
  const currentUser = useAppStore((state) => state.currentUser);
  const fileRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState<"all" | HouseDocumentCategory>("all");
  const [query, setQuery] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [preview, setPreview] = useState<HouseDocument | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [uploadCategory, setUploadCategory] = useState<HouseDocumentCategory>("report");
  const [version, setVersion] = useState("1.0");
  const [important, setImportant] = useState(false);
  const [requiresAck, setRequiresAck] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const canManage = currentUser.role === "admin" || currentUser.role === "hoa_official";

  const filtered = useMemo(() => documents.filter((document) => {
    if (document.status !== "active") return false;
    if (category !== "all" && document.category !== category) return false;
    const search = query.trim().toLowerCase();
    return !search || `${document.title} ${document.description} ${document.fileName} ${document.searchableText || ""}`.toLowerCase().includes(search);
  }), [category, documents, query]);
  const pendingAcknowledgements = documents.filter((document) => document.status === "active" && document.requiresAcknowledgement && !document.acknowledged).length;

  const chooseFile = (selected: File | null) => {
    setError("");
    if (!selected) { setFile(null); return; }
    const uploadError = validateUploadFile(selected, HOUSE_DOCUMENT_UPLOAD_TYPES);
    if (uploadError) { setError(uploadError); return; }
    setFile(selected);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError("");
    if (title.trim().length < 3 || !file) { setError("Укажите название и выберите файл."); return; }
    setBusy(true);
    try {
      await addDocument({ title: title.trim(), description: description.trim(), category: uploadCategory, version: version.trim() || "1.0", isImportant: important, requiresAcknowledgement: requiresAck }, file);
      setTitle(""); setDescription(""); setVersion("1.0"); setImportant(false); setRequiresAck(false); setFile(null); setShowUpload(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не удалось опубликовать документ");
    } finally { setBusy(false); }
  };

  return <div className="min-h-screen bg-[#f8f7f2]">
    <header className="border-b border-stone-200/80 px-4 py-5 sm:px-6 sm:py-7">
      <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-green-800">База знаний дома</p><h1 className="mt-1 text-2xl font-black tracking-[-0.035em] text-stone-950 sm:text-3xl">Документы</h1><p className="mt-1 text-sm leading-6 text-stone-600">Протоколы, отчёты и правила — с версиями и отметкой ознакомления.</p></div>{canManage && <button onClick={() => setShowUpload(true)} className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-2xl bg-green-800 px-4 text-xs font-extrabold text-white shadow-[0_10px_25px_rgba(22,101,52,.18)] hover:bg-green-900"><Plus className="h-4 w-4" /><span className="hidden sm:inline">Опубликовать</span></button>}</div>
      <div className="relative mt-5"><Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" /><label className="sr-only" htmlFor="document-search">Поиск документов</label><input id="document-search" value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder="Найти документ…" className="min-h-12 w-full rounded-2xl border border-stone-200 bg-white pl-11 pr-4 text-sm outline-none focus:border-green-700 focus:ring-2 focus:ring-green-700/15" /></div>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">{categories.map((item) => <button key={item.id} onClick={() => setCategory(item.id)} className={`min-h-10 shrink-0 rounded-full px-4 text-xs font-extrabold transition ${category === item.id ? "bg-green-800 text-white" : "bg-white text-stone-600 ring-1 ring-stone-200 hover:bg-stone-100"}`}>{item.label}</button>)}</div>
    </header>

    <section className="px-4 py-5 sm:px-6">
      {pendingAcknowledgements > 0 && <div className="mb-4 flex items-center gap-3 rounded-[22px] border border-amber-200 bg-amber-50 p-4"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-900"><FileClock className="h-5 w-5" /></span><div><p className="text-sm font-extrabold text-amber-950">Требуют ознакомления: {pendingAcknowledgements}</p><p className="text-xs leading-5 text-amber-800">Откройте документ и подтвердите, что вы его прочитали.</p></div></div>}
      {filtered.length === 0 ? <div className="rounded-[24px] border border-dashed border-stone-300 bg-white px-6 py-16 text-center"><FolderOpen className="mx-auto h-10 w-10 text-stone-300" /><h2 className="mt-4 font-extrabold text-stone-900">Документы не найдены</h2><p className="mt-1 text-sm text-stone-500">Измените фильтр или поисковый запрос.</p></div> : <div className="grid gap-3 xl:grid-cols-2">{filtered.map((document) => <DocumentCard key={document.id} document={document} canManage={canManage} onPreview={() => setPreview(document)} />)}</div>}
    </section>

    {preview && <div className="fixed inset-0 z-[80] flex items-end justify-center bg-stone-950/45 backdrop-blur-sm sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="document-preview-title"><div className="sheet-enter max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-t-[30px] bg-white p-5 shadow-2xl sm:rounded-[30px] sm:p-6"><div className="flex items-start justify-between gap-4"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-100 text-violet-800"><FileBarChart className="h-5 w-5" /></span><button onClick={() => setPreview(null)} className="grid h-11 w-11 place-items-center rounded-2xl bg-stone-100 text-stone-600 hover:bg-stone-200" aria-label="Закрыть"><X className="h-5 w-5" /></button></div><p className="mt-5 text-xs font-extrabold uppercase tracking-[0.12em] text-green-800">{categoryLabel[preview.category]} · версия {preview.version}</p><h2 id="document-preview-title" className="mt-2 text-xl font-black text-stone-950">{preview.title}</h2><p className="mt-3 text-sm leading-6 text-stone-600">{preview.description}</p>{preview.url && preview.mimeType === "application/pdf" && <iframe src={preview.url} title={preview.title} className="mt-4 h-[48vh] w-full rounded-2xl border border-stone-200" />}{preview.url && preview.mimeType.startsWith("image/") && <div className="relative mt-4 aspect-[4/3] overflow-hidden rounded-2xl bg-stone-100"><NextImage src={preview.url} alt={preview.title} fill unoptimized className="object-contain" /></div>}<dl className="mt-5 grid grid-cols-2 gap-3 rounded-2xl bg-stone-50 p-4 text-xs"><div><dt className="font-semibold text-stone-400">Файл</dt><dd className="mt-1 break-all font-bold text-stone-800">{preview.fileName}</dd></div><div><dt className="font-semibold text-stone-400">Опубликовал</dt><dd className="mt-1 font-bold text-stone-800">{preview.publishedBy}</dd></div></dl>{preview.url ? <a href={preview.url} target="_blank" rel="noreferrer" className="mt-5 flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-green-800 text-sm font-extrabold text-white hover:bg-green-900"><Download className="h-4 w-4" />Открыть файл</a> : <p className="mt-5 rounded-2xl bg-stone-100 p-3 text-xs font-semibold leading-5 text-stone-600">Это демонстрационная запись. Реальный файл появится после публикации документа через ОСИ.</p>}</div></div>}

    {showUpload && <div className="fixed inset-0 z-[80] flex items-end justify-center bg-stone-950/45 backdrop-blur-sm sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="upload-document-title"><form onSubmit={submit} className="sheet-enter max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-t-[30px] bg-white p-5 shadow-2xl sm:rounded-[30px] sm:p-6"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-extrabold uppercase tracking-[0.14em] text-green-800">Публикация ОСИ</p><h2 id="upload-document-title" className="mt-1 text-xl font-black text-stone-950">Новый документ</h2></div><button type="button" onClick={() => setShowUpload(false)} className="grid h-11 w-11 place-items-center rounded-2xl bg-stone-100 text-stone-600" aria-label="Закрыть"><X className="h-5 w-5" /></button></div>
      <div className="mt-5 space-y-4">
        <label className="block text-sm font-extrabold text-stone-900">Название<input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={160} className="mt-2 min-h-12 w-full rounded-2xl border border-stone-200 px-4 text-sm outline-none focus:border-green-700 focus:ring-2 focus:ring-green-700/15" /></label>
        <label className="block text-sm font-extrabold text-stone-900">Описание<textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={1000} rows={3} className="mt-2 w-full resize-none rounded-2xl border border-stone-200 p-4 text-sm outline-none focus:border-green-700 focus:ring-2 focus:ring-green-700/15" /></label>
        <div className="grid grid-cols-2 gap-3"><label className="block text-sm font-extrabold text-stone-900">Категория<select value={uploadCategory} onChange={(event) => setUploadCategory(event.target.value as HouseDocumentCategory)} className="mt-2 min-h-12 w-full rounded-2xl border border-stone-200 bg-white px-3 text-sm outline-none focus:border-green-700">{categories.filter((item) => item.id !== "all").map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label><label className="block text-sm font-extrabold text-stone-900">Версия<input value={version} onChange={(event) => setVersion(event.target.value)} maxLength={30} className="mt-2 min-h-12 w-full rounded-2xl border border-stone-200 px-4 text-sm outline-none focus:border-green-700" /></label></div>
        <div><input ref={fileRef} type="file" accept={HOUSE_DOCUMENT_UPLOAD_TYPES.join(",")} onChange={(event) => chooseFile(event.target.files?.[0] || null)} className="sr-only" /><button type="button" onClick={() => fileRef.current?.click()} className="flex min-h-16 w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-stone-300 bg-stone-50 text-sm font-bold text-stone-600 hover:border-green-500 hover:text-green-800"><Upload className="h-4 w-4" />{file ? file.name : "PDF, DOCX, XLSX или изображение · до 10 МБ"}</button></div>
        <label className="flex min-h-14 cursor-pointer items-center justify-between rounded-2xl border border-stone-200 px-4"><span className="text-sm font-bold text-stone-800">Отметить важным</span><input type="checkbox" checked={important} onChange={(event) => setImportant(event.target.checked)} className="h-5 w-5 accent-green-800" /></label>
        <label className="flex min-h-14 cursor-pointer items-center justify-between rounded-2xl border border-stone-200 px-4"><span><span className="block text-sm font-bold text-stone-800">Требовать ознакомление</span><span className="block text-xs text-stone-500">Жители подтвердят прочтение</span></span><input type="checkbox" checked={requiresAck} onChange={(event) => setRequiresAck(event.target.checked)} className="h-5 w-5 accent-green-800" /></label>
      </div>
      {error && <p role="alert" className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800">{error}</p>}
      <button disabled={busy} className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-green-800 text-sm font-extrabold text-white hover:bg-green-900 disabled:opacity-50">{busy ? <><LoaderCircle className="h-4 w-4 animate-spin" />Публикуем…</> : <><ShieldCheck className="h-4 w-4" />Опубликовать документ</>}</button>
    </form></div>}
  </div>;
}
