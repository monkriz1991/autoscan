import { routing } from "@/i18n/routing";

/** Локали из routing (ключи LOCALE_KEYWORDS). */
export type AppLocale = (typeof routing.locales)[number];

/**
 * Базовый список SEO-ключевых слов по локали (meta keywords + опционально доработка title/description
 * в `generateLocalizedMetadata`; у `en` список длиннее нишевых локалей).
 */
export const LOCALE_KEYWORDS: Record<AppLocale, readonly string[]> = {
  en: [
    "ELM327 app for Windows 10",
    "free OBD2 scanner software",
    "AI car diagnostic app free",
    "OBD2 live data PIDs",
    "elm327 app for pc",
    "obd2 ai",
    "elm327",
    "p0420",
    "aiscan",
    "dtc p0420",
    "auto scan",
    "aichatone",
    "car diagnostics",
    "obd2 ubuntu",
    "obd2 elm327",
    "ai car scanner app",
    "obd2 ai car scanner",
    "elm327 scanner",
    "elm327 app",
  ],
  ru: [
    "приложение ELM327 для Windows 10",
    "бесплатный OBD2 сканер",
    "ИИ диагностика авто бесплатно",
    "live data PID OBD2",
    "ELM327 для ПК",
    // Популярные латинские запросы в магазинах (смешанный поиск RU)
    "ai car scanner app",
    "obd2 ai car scanner",
    "elm327 scanner",
    "elm327 app",
  ],
  de: [
    "ELM327 App Windows 10",
    "kostenlose OBD2 Software",
    "KI Auto Diagnose App gratis",
    "OBD2 Live Daten PID",
    "ELM327 PC Software",
  ],
  pl: [
    "aplikacja ELM327 Windows 10",
    "darmowy skaner OBD2",
    "darmowa diagnostyka AI samochodu",
    "PID live data OBD2",
    "ELM327 na PC",
  ],
  es: [
    "app ELM327 Windows 10",
    "software escáner OBD2 gratis",
    "app diagnóstico coche IA gratis",
    "PIDs datos en vivo OBD2",
    "ELM327 para PC",
  ],
  it: [
    "app ELM327 Windows 10",
    "software scanner OBD2 gratuito",
    "app diagnostica auto IA gratuita",
    "PID dati live OBD2",
    "ELM327 per PC",
  ],
};
