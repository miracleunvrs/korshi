"use client";

import { useState } from "react";
import { 
  Users, 
  ShieldCheck, 
  Check, 
  X, 
  Building2, 
  Smartphone, 
  Mail, 
  KeyRound, 
  ArrowRight,
  Sparkles
} from "lucide-react";
import { useAppStore, TEST_ACCOUNTS } from "@/stores/appStore";

export default function AccountSwitcherModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { currentUser, switchAccount } = useAppStore();
  const [loginMode, setLoginMode] = useState<"quick" | "otp">("quick");
  const [phoneNumber, setPhoneNumber] = useState("+7 (777) ");
  const [otpCode, setOtpCode] = useState("");
  const [otpStep, setOtpStep] = useState<"phone" | "code">("phone");
  const [otpSentNotice, setOtpSentNotice] = useState(false);

  if (!isOpen) return null;

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setOtpSentNotice(true);
    setOtpStep("code");
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    // Находим или создаем пользователя
    const existing = TEST_ACCOUNTS.find((a) => a.phone.includes(phoneNumber.replace(/\D/g, "").slice(-7)));
    if (existing) {
      switchAccount(existing.id);
    } else {
      switchAccount(TEST_ACCOUNTS[0].id);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 space-y-5 shadow-2xl">
        {/* Заголовок */}
        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-green-600" />
            <h3 className="font-bold text-gray-900 text-sm">
              {loginMode === "quick" ? "Тестовые аккаунты (1 клик)" : "Вход по номеру телефона / SMS"}
            </h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Переключатель режимов */}
        <div className="flex bg-gray-100 p-1 rounded-2xl text-xs font-bold">
          <button
            onClick={() => setLoginMode("quick")}
            className={`flex-1 py-2 rounded-xl transition ${
              loginMode === "quick" ? "bg-white text-gray-900 shadow-xs" : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Быстрый выбор роли
          </button>
          <button
            onClick={() => setLoginMode("otp")}
            className={`flex-1 py-2 rounded-xl transition ${
              loginMode === "otp" ? "bg-white text-gray-900 shadow-xs" : "text-gray-500 hover:text-gray-900"
            }`}
          >
            SMS / Номер телефона
          </button>
        </div>

        {/* Режим 1: Быстрый выбор аккаунта */}
        {loginMode === "quick" && (
          <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
            {TEST_ACCOUNTS.map((acc) => {
              const isSelected = currentUser.id === acc.id;

              return (
                <div
                  key={acc.id}
                  onClick={() => {
                    switchAccount(acc.id);
                    onClose();
                  }}
                  className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? "bg-green-50/80 border-green-500 shadow-xs"
                      : "bg-gray-50/60 border-gray-200/70 hover:bg-gray-100/80"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={acc.avatarUrl}
                      alt={acc.fullName}
                      className="w-11 h-11 rounded-xl object-cover ring-2 ring-white shrink-0 shadow-xs"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="font-bold text-gray-900 text-xs">{acc.fullName}</p>
                        {acc.verified && <ShieldCheck className="w-3.5 h-3.5 text-green-600" />}
                      </div>
                      <p className="text-[11px] font-semibold text-green-700">{acc.roleLabel}</p>
                      <p className="text-[10px] text-gray-400">{acc.phone}</p>
                    </div>
                  </div>

                  {isSelected ? (
                    <div className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  ) : (
                    <span className="text-[11px] font-bold text-gray-400 group-hover:text-gray-700">
                      Войти →
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Режим 2: Вход по телефону с SMS OTP кодом */}
        {loginMode === "otp" && (
          <div className="space-y-4">
            {otpStep === "phone" ? (
              <form onSubmit={handleSendOtp} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Номер мобильного телефона
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+7 (777) 123-45-67"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    В тестовом режиме код подтверждения: <strong className="text-green-700 font-bold">123456</strong>
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-green-600 hover:bg-green-700 active:scale-95 text-white font-bold text-xs rounded-2xl shadow-md transition"
                >
                  Получить SMS-код
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-3">
                <div className="p-3 bg-green-50 border border-green-200 rounded-2xl text-xs text-green-800 space-y-0.5">
                  <p className="font-bold">SMS-код отправлен на номер</p>
                  <p className="text-[11px] font-semibold">{phoneNumber}</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    6-значный код из SMS / Push
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="123456"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-base font-black text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setOtpStep("phone")}
                    className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-2xl transition"
                  >
                    Назад
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-green-600 hover:bg-green-700 active:scale-95 text-white font-bold text-xs rounded-2xl shadow-md transition"
                  >
                    Войти в систему
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
