import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  /** Порядок: default (en), затем остальные — для sitemap/hreflang в едином порядке */
  locales: ["en", "ru", "de", "pl", "es", "it"],
  /** Язык по умолчанию и фалбэк для путей без префикса локали */
  defaultLocale: "en",
  /** EN без префикса в URL (/), остальные локали — /de, /ru, … */
  localePrefix: "as-needed",
  /**
   * Локаль только из префикса URL и cookie NEXT_LOCALE (без Accept-Language).
   * Иначе краулеры без Accept-Language (в т.ч. Googlebot) всегда видят defaultLocale на `/`,
   * а пользователи с «чужим» Accept-Language получают редирект на /de и т.д. — расхождение с тем, что индексирует бот.
   * Сигнал языка для поиска — hreflang в метаданных (`alternateLanguageUrls` в layout).
   */
  localeDetection: false,
});
