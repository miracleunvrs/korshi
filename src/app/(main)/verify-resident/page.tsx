"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, ShieldAlert, UploadCloud, FileCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { useAppStore } from "@/stores/appStore";
import { DOCUMENT_UPLOAD_TYPES, validateUploadFile } from "@/lib/uploadLimits";
import { complexName } from "@/lib/appConfig";
import { uploadWithRetry } from "@/lib/supabase/uploadWithRetry";

export default function VerifyResidentPage() {
  const router = useRouter();
  const supabase = createClient();
  const { currentUser, submitVerificationRequest } = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [document, setDocument] = useState<File | null>(null);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSupabaseConfigured()) {
        if (!document) throw new Error("Выберите документ для загрузки");
        const validationError = validateUploadFile(document, DOCUMENT_UPLOAD_TYPES);
        if (validationError) throw new Error(validationError);

        const path = `${currentUser.id}/verification/${crypto.randomUUID()}-${document.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
        await uploadWithRetry(() => supabase.storage.from("house-media").upload(path, document, {
          contentType: document.type || "application/octet-stream",
          upsert: false,
        }));

        await submitVerificationRequest({
          fullName: currentUser.fullName,
          phone: currentUser.phone,
          buildingNumber: currentUser.buildingNumber,
          entranceNumber: currentUser.entranceNumber,
          apartmentNumber: currentUser.apartmentNumber,
          documentType: document.type || "document",
          documentPath: path,
        });
      } else {
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
      setLoading(false);
      setSubmitted(true);
    } catch (submitError) {
      setLoading(false);
      const rawMessage = submitError instanceof Error ? submitError.message : "";
      if (/bucket not found/i.test(rawMessage)) {
        setError("Хранилище документов ещё не создано в Supabase. Примените миграции проекта и повторите попытку.");
      } else if (/row-level security|not authorized|permission denied/i.test(rawMessage)) {
        setError("У хранилища документов ещё не применены политики доступа Supabase. Примените миграции проекта.");
      } else {
        setError(rawMessage || "Не удалось отправить документы");
      }
    }
  };

  return (
    <div className="min-h-screen bg-white pb-10">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <Link href="/profile" className="text-gray-600 p-1 -ml-1">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-semibold text-gray-900 text-sm">Подтверждение жителя</h1>
        <div className="w-5" />
      </div>

      <div className="p-6 text-center max-w-sm mx-auto space-y-6">
        {/* Иллюстрация бейджа */}
        <div className="w-24 h-24 bg-green-50 border-2 border-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
          <FileCheck className="w-12 h-12" />
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-bold text-gray-900">
            Подтвердите статус жителя ЖК «{complexName(currentUser.complexName)}»
          </h2>
          <p className="text-xs text-gray-500 leading-relaxed">
            Для доступа ко всем возможностям закрытого сообщества (чаты подъездов, голосования, инициативы) необходимо подтвердить проживание.
          </p>
        </div>

        {/* Список шагов */}
        <div className="text-left bg-gray-50 p-4 rounded-2xl space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
            <p className="text-xs text-gray-700">
              Договор аренды или справка о зарегистрированных правах (ЕГРН/eGov)
            </p>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
            <p className="text-xs text-gray-700">
              Удостоверение личности или паспорт
            </p>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
            <p className="text-xs text-gray-700">
              Заявка будет конфиденциально рассмотрена администратором ЖК
            </p>
          </div>
        </div>

        {submitted ? (
          <div className="p-4 bg-green-50 border border-green-200 rounded-xl space-y-1">
            <p className="text-sm font-semibold text-green-800">Документы отправлены!</p>
            <p className="text-xs text-green-600">
              Администратор проверит данные в течение 24 часов.
            </p>
            <button
              onClick={() => router.push("/profile")}
              className="mt-3 w-full py-2 bg-green-600 text-white rounded-lg text-xs font-medium"
            >
              Вернуться в профиль
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-200 p-6 rounded-2xl hover:border-green-400 cursor-pointer transition"
            >
              <UploadCloud className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-xs font-medium text-gray-700">
                {document ? document.name : "Загрузить фото документов"}
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">PNG, JPG или PDF до 10 МБ</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,application/pdf"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0] || null;
                  if (file) {
                    const uploadError = validateUploadFile(file, DOCUMENT_UPLOAD_TYPES);
                    if (uploadError) {
                      setError(uploadError);
                      event.currentTarget.value = "";
                      return;
                    }
                  }
                  setError("");
                  setDocument(file);
                }}
              />
            </div>

            {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-green-600 text-white font-medium text-sm rounded-xl shadow-md hover:bg-green-700 transition"
            >
              {loading ? "Отправка заявки..." : "Отправить документы"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
