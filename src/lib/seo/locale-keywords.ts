import { routing } from "@/i18n/routing";

/** Локали из routing (ключи LOCALE_KEYWORDS). */
export type AppLocale = (typeof routing.locales)[number];

/**
 * Топ-5 SEO-ключевых слов по локали (meta keywords + опционально доработка title/description
 * в `generateLocalizedMetadata`).
 */
export const LOCALE_KEYWORDS: Record<AppLocale, readonly string[]> = {
  en: [
    "OBD2 car diagnostics app",
    "free ELM327 scanner",
    "check engine light codes",
    "AI car repair assistant",
    "engine fault code reader",
  ],
  ru: [
    "диагностика авто OBD2",
    "сканер ошибок ELM327",
    "коды ошибок двигателя Check Engine",
    "ИИ диагностика автомобиля",
    "приложение OBD2 сканер",
  ],
  de: [
    "Auto Diagnose App",
    "OBD2 Scanner kostenlos",
    "Motorfehler auslesen",
    "ELM327 Software",
    "KFZ Diagnose per USB Bluetooth",
  ],
  pl: [
    "diagnostyka OBD2",
    "skaner błędów silnika",
    "kody usterek samochodowych",
    "aplikacja ELM327",
    "komputer pokładowy OBD",
  ],
  es: [
    "diagnóstico coche OBD2",
    "escáner OBD2 gratis",
    "códigos fallo motor",
    "app ELM327",
    "luz motor avería",
  ],
  it: [
    "diagnostica auto OBD2",
    "scanner OBD2 gratis",
    "codici errore motore",
    "app ELM327",
    "spia motore accesa",
  ],
};
