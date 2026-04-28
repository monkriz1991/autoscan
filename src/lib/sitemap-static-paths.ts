import { routing } from "@/i18n/routing";
import { localizedPath } from "@/lib/site-url";

/**
 * Публичные пути без префикса локали для sitemap (индексируемые).
 * Пустая строка — главная. DTC подключаются отдельно при появлении данных в БД.
 */
export const SITEMAP_PATHS_WITHOUT_LOCALE = [
  "",
  "/pricing",
  "/marketing/terms",
  "/marketing/privacy",
  "/marketing/contacts",
  "/faq",
  "/download",
  "/blog",
  "/dtc",
] as const;

export function allLocalizedSitemapPaths(): string[] {
  const out: string[] = [];
  for (const p of SITEMAP_PATHS_WITHOUT_LOCALE) {
    const segment = p === "" ? "" : p;
    for (const locale of routing.locales) {
      out.push(localizedPath(locale, segment));
    }
  }
  return out;
}
