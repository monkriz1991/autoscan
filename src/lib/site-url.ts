import { routing } from "@/i18n/routing";

/** Базовый origin сайта для canonical, Open Graph и sitemap (NEXT_PUBLIC_SITE_URL). */
export function getSiteOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return raw.replace(/\/$/, "");
}

export function getMetadataBase(): URL {
  return new URL(`${getSiteOrigin()}/`);
}

/**
 * Путь без префикса локали, с ведущим слэшем или пустая строка для главной.
 * Пример: "", "/marketing/pricing", "/faq", "/blog/post-slug"
 */
export function alternateLanguageUrls(pathWithoutLocale: string): Record<string, string> {
  const origin = getSiteOrigin();
  const path =
    pathWithoutLocale === "" || pathWithoutLocale === "/"
      ? ""
      : pathWithoutLocale.startsWith("/")
        ? pathWithoutLocale
        : `/${pathWithoutLocale}`;
  const out: Record<string, string> = {};
  for (const locale of routing.locales) {
    out[locale] = `${origin}/${locale}${path}`;
  }
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
