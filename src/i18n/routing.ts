import { defineRouting } from "next-intl/routing";

/** Единый список локалей (источник правды для middleware, i18n.ts, переключателя языка). */
export const SUPPORTED_LOCALES = ["en", "ru", "de", "pl", "es", "it"] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

export const routing = defineRouting({
  /** Порядок: default (en), затем остальные — для sitemap/hreflang в едином порядке */
  locales: [...SUPPORTED_LOCALES],
  /** Язык по умолчанию и фалбэк для путей без префикса локали */
  defaultLocale: "en",
  /** EN без префикса в URL (/), остальные локали — /de, /ru, … */
  localePrefix: "as-needed",
  /**
   * Локаль только из префикса URL (без Accept-Language).
   * Иначе краулеры без Accept-Language (в т.ч. Googlebot) всегда видят defaultLocale на `/`,
   * а пользователи с «чужим» Accept-Language получают редирект на /de и т.д. — расхождение с тем, что индексирует бот.
   * Сигнал языка для поиска — hreflang в метаданных (`alternateLanguageUrls` в layout).
   */
  localeDetection: false,
  /**
   * Без Set-Cookie NEXT_LOCALE: иначе Next помечает ответ как cookie-dependent → Cache-Control private,
   * и CDN не применяет s-maxage из next.config.mjs.
   */
  localeCookie: false,
});
