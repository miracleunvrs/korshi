"use client";

import { X, Check } from "lucide-react";
import { useEffect } from "react";

interface FeedFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTerritory: string;
  onSelectTerritory: (t: string) => void;
  selectedType: string;
  onSelectType: (t: string) => void;
  onReset: () => void;
}

export default function FeedFilterModal({
  isOpen,
  onClose,
  selectedTerritory,
  onSelectTerritory,
  selectedType,
  onSelectType,
  onReset,
}: FeedFilterModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);

    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const territories = [
    { id: "all", label: "Весь ЖК" },
    { id: "building", label: "Мой дом" },
    { id: "entrance", label: "Мой подъезд" },
  ];

  const types = [
    { id: "all", label: "Все" },
    { id: "post", label: "Публикации" },
    { id: "announcement", label: "Объявления" },
    { id: "service", label: "Услуги" },
    { id: "poll_initiative", label: "Опросы и инициативы" },
    { id: "official", label: "Официальное" },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Фильтры"
    >
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto overscroll-contain bg-[#18181b] text-white rounded-t-3xl sm:rounded-3xl p-5 space-y-6 animate-in slide-in-from-bottom duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="p-1 text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h2 className="font-bold text-base">Фильтры</h2>
          </div>
          <button
            onClick={onReset}
            className="text-xs font-semibold text-gray-400 hover:text-green-400 transition"
          >
            Сбросить
          </button>
        </div>

        {/* Секция: Территория */}
        <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
            Территория
          </h3>
          <div className="space-y-2">
            {territories.map((t) => {
              const isSelected = selectedTerritory === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => onSelectTerritory(t.id)}
                  className={`w-full flex items-center justify-between p-3.5 rounded-2xl transition ${
                    isSelected
                      ? "bg-zinc-800 text-white font-semibold"
                      : "text-zinc-400 hover:bg-zinc-800/50 hover:text-white"
                  }`}
                >
                  <span className="text-sm">{t.label}</span>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center text-white">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Секция: Тип публикации */}
        <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
            Тип публикации
          </h3>
          <div className="space-y-1">
            {types.map((type) => {
              const isSelected = selectedType === type.id;
              return (
                <button
                  key={type.id}
                  onClick={() => onSelectType(type.id)}
                  className={`w-full flex items-center justify-between p-3.5 rounded-2xl transition ${
                    isSelected
                      ? "bg-zinc-800 text-white font-semibold"
                      : "text-zinc-400 hover:bg-zinc-800/50 hover:text-white"
                  }`}
                >
                  <span className="text-sm">{type.label}</span>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center text-white">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Кнопка применить */}
        <button
          onClick={onClose}
          className="w-full py-3.5 bg-green-600 hover:bg-green-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-green-600/30 transition"
        >
          Показать результаты
        </button>
      </div>
    </div>
  );
}
