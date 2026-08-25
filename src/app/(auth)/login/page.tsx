"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, ArrowRight, CheckCircle2 } from "lucide-react";
import { useAppStore } from "@/stores/appStore";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function LoginPage() {
  const router = useRouter();
  const { loginUser, registerUser, resetPassword, switchAccount, registeredUsers } = useAppStore();
  const demoMode = !isSupabaseConfigured();

  const [activeTab, setActiveTab] = useState<"login" | "register" | "demo">(
    demoMode ? "demo" : "login"
  );

  // Login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // Register form
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regBuilding, setRegBuilding] = useState("1");
  const [regEntrance, setRegEntrance] = useState(1);
  const [regApartment, setRegApartment] = useState("");
  const [regRole, setRegRole] = useState<"resident" | "service_provider">("resident");
  const [regError, setRegError] = useState("");
  const [regLoading, setRegLoading] = useState(false);
  const [regSuccess, setRegSuccess] = useState(false);
  const [regNeedsConfirmation, setRegNeedsConfirmation] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    try {
      if (!loginEmail.trim() || !loginPassword) {
        setLoginError("Введите email и пароль");
        setLoginLoading(false);
        return;
      }
      await loginUser(loginEmail.trim(), loginPassword);
      router.push("/feed");
    } catch (err: any) {
      setLoginError(err?.message || "Ошибка входа");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regApartment.trim() || !regEmail.trim()) {
      setRegError("Заполните ФИО, email и квартиру");
      return;
    }
    if (regPassword.length < 6) {
      setRegError("Пароль должен содержать минимум 6 символов");
      return;
    }
    setRegError("");
    setRegLoading(true);

    try {
      const result = await registerUser({
        fullName: regName.trim(),
        phone: regPhone.trim(),
        email: regEmail.trim(),
        password: regPassword,
        buildingNumber: regBuilding,
        entranceNumber: Number(regEntrance) || 1,
        apartmentNumber: regApartment.trim(),
        role: regRole,
      });
      setRegNeedsConfirmation(result.requiresEmailConfirmation);
      setRegSuccess(true);
      if (!result.requiresEmailConfirmation) {
        setTimeout(() => router.push("/feed"), 800);
      }
    } catch (err: any) {
      setRegError(err?.message || "Ошибка регистрации");
    } finally {
      setRegLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setLoginError("");
    if (!loginEmail.trim()) {
      setLoginError("Сначала введите email");
      return;
    }
    setLoginLoading(true);
    try {
      await resetPassword(loginEmail);
      setResetSent(true);
    } catch (err: any) {
      setLoginError(err?.message || "Не удалось отправить письмо");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleQuickDemo = (userId: string) => {
    switchAccount(userId);
    router.push("/feed");
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col justify-center items-center p-4 sm:p-6 text-white selection:bg-green-500 selection:text-white">
      <div className="w-full max-w-md bg-white text-gray-900 rounded-[36px] p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Логотип */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-green-600 to-emerald-500 flex items-center justify-center text-white font-black text-xl mx-auto shadow-lg shadow-green-600/30">
            ЖК
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <h1 className="text-2xl font-black tracking-tight text-gray-900">ЖК «Солнечный»</h1>
            <ShieldCheck className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-xs text-gray-500 font-medium">Закрытая цифровая среда для жителей дома</p>
        </div>

        {/* Табы */}
        <div className="flex bg-gray-100 p-1 rounded-2xl text-xs font-bold">
          {demoMode && (
            <button
              onClick={() => setActiveTab("demo")}
              className={`flex-1 py-2.5 rounded-xl transition ${
                activeTab === "demo" ? "bg-white text-gray-900 shadow-xs" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Быстрый вход
            </button>
          )}
          <button
            onClick={() => setActiveTab("register")}
            className={`flex-1 py-2.5 rounded-xl transition ${
              activeTab === "register" ? "bg-white text-gray-900 shadow-xs" : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Регистрация жильца
          </button>
          <button
            onClick={() => setActiveTab("login")}
            className={`flex-1 py-2.5 rounded-xl transition ${
              activeTab === "login" ? "bg-white text-gray-900 shadow-xs" : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Вход
          </button>
        </div>

        {/* Вкладка 1: Быстрый демо-вход */}
        {activeTab === "demo" && (
          <div className="space-y-3">
            <p className="text-xs text-gray-500 text-center font-medium">
              Выберите роль для мгновенного входа:
            </p>
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {registeredUsers.map((acc) => (
                <div
                  key={acc.id}
                  onClick={() => handleQuickDemo(acc.id)}
                  className="p-3 rounded-2xl border border-gray-200/80 hover:border-green-500 hover:bg-green-50/50 transition cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={acc.avatarUrl}
                      alt={acc.fullName}
                      className="w-10 h-10 rounded-xl object-cover ring-2 ring-gray-100 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-1">
                        <p className="font-bold text-gray-900 text-xs group-hover:text-green-700 transition">
                          {acc.fullName}
                        </p>
                        {acc.verified && <ShieldCheck className="w-3.5 h-3.5 text-green-600" />}
                      </div>
                      <p className="text-[11px] font-semibold text-green-700">{acc.roleLabel}</p>
                      <p className="text-[10px] text-gray-400">{acc.phone}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-gray-400 group-hover:text-green-600 group-hover:translate-x-0.5 transition-transform">
                    Войти →
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Вкладка 2: Регистрация нового жильца */}
        {activeTab === "register" && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3">
            {regSuccess ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto" />
                <p className="text-sm font-bold text-green-800">Регистрация успешна!</p>
                <p className="text-xs text-green-600">
                  {regNeedsConfirmation
                    ? "Подтвердите email по ссылке из письма, затем войдите."
                    : "Переход в ленту..."}
                </p>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    ФИО (как в удостоверении)
                  </label>
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Иван Иванов"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-green-500"
                    
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                  <p className="text-[11px] text-gray-400 mt-1">Для входа по email и восстановления</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Пароль</label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Минимум 6 символов"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-green-500"
                    minLength={6}
                    required
                  />
                  <button type="button" onClick={handleResetPassword} className="mt-2 text-[11px] font-bold text-green-700 hover:text-green-800">
                    Забыли пароль?
                  </button>
                </div>
                {resetSent && <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-800">Письмо для смены пароля отправлено на email.</div>}

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Номер мобильного телефона
                  </label>
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="+7 (777) 123-45-67"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
              </>
            )}

            {!regSuccess && <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Дом №</label>
                <select
                  value={regBuilding}
                  onChange={(e) => setRegBuilding(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="1">Дом 1</option>
                  <option value="2">Дом 2</option>
                  <option value="3">Дом 3</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Подъезд</label>
                <input
                  type="number"
                  value={regEntrance}
                  onChange={(e) => setRegEntrance(Number(e.target.value))}
                  min={1}
                  max={6}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Кв. №</label>
                <input
                  type="text"
                  value={regApartment}
                  onChange={(e) => setRegApartment(e.target.value)}
                  placeholder="45"
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
            </div>}

            {!regSuccess && <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Роль в ЖК</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRegRole("resident")}
                  className={`py-2 rounded-xl text-xs font-bold border transition ${
                    regRole === "resident"
                      ? "bg-green-50 border-green-600 text-green-700"
                      : "bg-gray-50 border-gray-200 text-gray-600"
                  }`}
                >
                  Житель / Собственник
                </button>
                <button
                  type="button"
                  onClick={() => setRegRole("service_provider")}
                  className={`py-2 rounded-xl text-xs font-bold border transition ${
                    regRole === "service_provider"
                      ? "bg-green-50 border-green-600 text-green-700"
                      : "bg-gray-50 border-gray-200 text-gray-600"
                  }`}
                >
                  Мастер услуг ЖК
                </button>
              </div>
            </div>}

            {!regSuccess && regError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
                {regError}
              </div>
            )}

            {!regSuccess && <button
              type="submit"
              disabled={regLoading}
              className="w-full py-3 bg-green-600 hover:bg-green-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50"
            >
              {regLoading ? "Регистрация..." : "Зарегистрироваться и войти в ЖК"}
            </button>}
          </form>
        )}

        {/* Вкладка 3: Вход */}
        {activeTab === "login" && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Пароль</label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Введите пароль"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
            </>

            {loginError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3.5 bg-green-600 hover:bg-green-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <span>
                  {loginLoading ? "Подождите..." : "Войти по email"}
              </span>
              {!loginLoading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
