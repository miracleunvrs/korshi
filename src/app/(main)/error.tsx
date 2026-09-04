"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function MainError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="grid min-h-[70dvh] place-items-center px-6 py-12 text-center">
      <div className="max-w-sm">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-rose-50 text-rose-700">
          <AlertTriangle className="h-6 w-6" aria-hidden="true" />
        </span>
        <h1 className="mt-5 text-2xl font-black text-stone-950">Раздел не загрузился</h1>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Проверьте подключение и попробуйте ещё раз. Введённые данные в других разделах не изменены.
        </p>
        <button
          type="button"
          onClick={retry}
          className="btn-press mx-auto mt-6 flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-green-800 px-5 text-sm font-extrabold text-white hover:bg-green-900"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Повторить загрузку
        </button>
      </div>
    </div>
  );
}
