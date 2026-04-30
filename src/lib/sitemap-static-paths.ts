import { localizedPath, PUBLIC_SEO_LOCALE_CODES } from "@/lib/site-url";

/**
 * Публичные пути без префикса локали для sitemap (индексируемые).
 * Пустая строка — главная. DTC подключаются отдельно при появлении данных в БД.
 */
export const SITEMAP_PATHS_WITHOUT_LOCALE = [
  "",
  "/about",
  "/pricing",
  "/terms",
  "/privacy",
  "/contacts",
  "/marketing/compare-obd2-apps",
  "/faq",
  "/download",
  "/blog",
  "/dtc",
  "/windows-obd2-app",
  "/mac-obd2-scanner",
  "/linux-obd2",
] as const;

export function allLocalizedSitemapPaths(): string[] {
  const out: string[] = [];
  for (const p of SITEMAP_PATHS_WITHOUT_LOCALE) {
    const segment = p === "" ? "" : p;
    for (const locale of PUBLIC_SEO_LOCALE_CODES) {
      out.push(localizedPath(locale, segment));
    }
  }
  return out;
}
