"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Пароль должен содержать минимум 6 символов");
      return;
    }
    setLoading(true);
    const { error: updateError } = await createClient().auth.updateUser({ password });
    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setMessage("Пароль изменён. Сейчас откроется лента.");
    setTimeout(() => router.push("/feed"), 800);
  };

  return (
    <main className="min-h-screen bg-[#09090b] flex items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-3xl bg-white p-7 space-y-4">
        <h1 className="text-xl font-black text-gray-900">Новый пароль</h1>
        <p className="text-xs text-gray-500">Введите новый пароль для аккаунта HouseSM.</p>
        <input type="password" minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Минимум 6 символов" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-green-500" />
        {error && <p className="text-xs text-red-600">{error}</p>}
        {message && <p className="text-xs text-green-700">{message}</p>}
        <button disabled={loading} className="w-full py-3 rounded-xl bg-green-600 text-white text-sm font-bold disabled:opacity-50">{loading ? "Сохраняем…" : "Сохранить пароль"}</button>
      </form>
    </main>
  );
}
