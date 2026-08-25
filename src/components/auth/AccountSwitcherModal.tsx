"use client";

import { Users, ShieldCheck, Check, X } from "lucide-react";
import { useAppStore, TEST_ACCOUNTS } from "@/stores/appStore";

export default function AccountSwitcherModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { currentUser, switchAccount } = useAppStore();
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 space-y-5 shadow-2xl">
        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
          <div className="flex items-center gap-2"><Users className="w-5 h-5 text-green-600" /><h3 className="font-bold text-gray-900 text-sm">Тестовые аккаунты</h3></div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1" aria-label="Закрыть"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
          {TEST_ACCOUNTS.map((account) => {
            const selected = currentUser.id === account.id;
            return (
              <button type="button" key={account.id} onClick={() => { switchAccount(account.id); onClose(); }} className={`w-full p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 text-left ${selected ? "bg-green-50/80 border-green-500" : "bg-gray-50/60 border-gray-200/70 hover:bg-gray-100/80"}`}>
                <span className="flex items-center gap-3">
                  <img src={account.avatarUrl} alt={account.fullName} className="w-11 h-11 rounded-xl object-cover ring-2 ring-white shrink-0" />
                  <span><span className="flex items-center gap-1.5 font-bold text-gray-900 text-xs">{account.fullName}{account.verified && <ShieldCheck className="w-3.5 h-3.5 text-green-600" />}</span><span className="block text-[11px] font-semibold text-green-700">{account.roleLabel}</span><span className="block text-[10px] text-gray-400">{account.email}</span></span>
                </span>
                {selected && <span className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center shrink-0"><Check className="w-3.5 h-3.5 stroke-[3]" /></span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
