export const APP_CONFIG = {
  brandName: "Korshi",
  fallbackComplexName: "Солнечный",
  fallbackComplexAddress: "Алматы",
  emergencyPhone: "109",
  dispatcherPhone: "+7 (777) 123-45-67",
} as const;

export function complexName(value?: string | null) {
  return value?.trim() || APP_CONFIG.fallbackComplexName;
}

export function complexTitle(value?: string | null) {
  return `ЖК «${complexName(value)}»`;
}
