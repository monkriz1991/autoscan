import { routing } from "@/i18n/routing";

/** Базовый origin сайта для canonical, Open Graph и sitemap (NEXT_PUBLIC_SITE_URL). */
export function getSiteOrigin(): string {
  const raw = (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    process.env.FRONTEND_BASE_URL ||
    "https://aiscanauto.com"
  ).trim();
  return raw.replace(/\/$/, "");
}

export function getMetadataBase(): URL {
  return new URL(`${getSiteOrigin()}/`);
}

/**
 * Нормализованный путь без префикса локали: "" для главной, иначе "/faq", "/blog/slug".
 */
export function pathWithoutLocaleSegment(pathWithoutLocale: string): string {
  if (pathWithoutLocale === "" || pathWithoutLocale === "/") {
    return "";
  }
  return pathWithoutLocale.startsWith("/") ? pathWithoutLocale : `/${pathWithoutLocale}`;
}

/**
 * Путь с префиксом локали для редиректов (localePrefix: as-needed — defaultLocale без префикса).
 */
export function localizedPath(locale: string, pathWithoutLocale: string): string {
  const path = pathWithoutLocaleSegment(pathWithoutLocale);
  if (locale === routing.defaultLocale) {
    return path === "" ? "/" : path;
  }
  return path === "" ? `/${locale}` : `/${locale}${path}`;
}

/**
 * Путь без префикса локали, с ведущим слэшем или пустая строка для главной.
 * Пример: "", "/marketing/pricing", "/faq", "/blog/post-slug"
 * Включает ключ x-default (URL defaultLocale) для hreflang.
 */
export function alternateLanguageUrls(pathWithoutLocale: string): Record<string, string> {
  const origin = getSiteOrigin();
  const path = pathWithoutLocaleSegment(pathWithoutLocale);
  const out: Record<string, string> = {};
  for (const locale of routing.locales) {
    if (locale === routing.defaultLocale) {
      out[locale] = path === "" ? `${origin}/` : `${origin}${path}`;
    } else {
      out[locale] = path === "" ? `${origin}/${locale}` : `${origin}/${locale}${path}`;
    }
  }
  out["x-default"] = out[routing.defaultLocale];
  return out;
}

/** Локаль для og:locale */
export function localeToOpenGraphLocale(locale: string): string {
  const map: Record<string, string> = {
    en: "en_US",
    de: "de_DE",
    ru: "ru_RU",
    pl: "pl_PL",
    it: "it_IT",
    es: "es_ES",
  };
  return map[locale] ?? "en_US";
}
