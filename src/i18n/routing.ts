import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  /** Порядок: default (en), затем остальные — для sitemap/hreflang в едином порядке */
  locales: ["en", "ru", "de", "pl", "es", "it"],
  /** Язык по умолчанию и фалбэк, если Accept-Language не совпал ни с одной локалью */
  defaultLocale: "en",
  /** EN без префикса в URL (/), остальные локали — /de, /ru, … */
  localePrefix: "as-needed",
  /** Cookie NEXT_LOCALE → Accept-Language → defaultLocale (см. next-intl middleware) */
  localeDetection: true,
});
