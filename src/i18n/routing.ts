import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "de", "ru", "pl", "it", "es"],
  /** Язык по умолчанию и фалбэк, если Accept-Language не совпал ни с одной локалью */
  defaultLocale: "en",
  localePrefix: "always",
  /** Cookie NEXT_LOCALE → Accept-Language → defaultLocale (см. next-intl middleware) */
  localeDetection: true,
});
