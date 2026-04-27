import { routing } from "@/i18n/routing";
import { localizedPath } from "@/lib/site-url";

/**
 * Публичные пути без префикса локали для sitemap (индексируемые).
 * Пустая строка — главная. DTC подключаются отдельно при появлении данных в БД.
 */
export const SITEMAP_PATHS_WITHOUT_LOCALE = [
  "",
  "/marketing/pricing",
  "/marketing/terms",
  "/marketing/privacy",
  "/marketing/contacts",
  "/faq",
  "/download",
  "/blog",
] as const;

/** Коды DTC в sitemap; расширять из БД. Синхронизировано с примером в app/[locale]/dtc/[code]/page.tsx. */
export const DTC_CODES_FOR_SITEMAP: string[] = ["P0420"];

export function allLocalizedSitemapPaths(): string[] {
  const out: string[] = [];
  for (const p of SITEMAP_PATHS_WITHOUT_LOCALE) {
    const segment = p === "" ? "" : p;
    for (const locale of routing.locales) {
      out.push(localizedPath(locale, segment));
    }
  }
  for (const code of DTC_CODES_FOR_SITEMAP) {
    const dtcPath = `/dtc/${code.toUpperCase()}`;
    for (const locale of routing.locales) {
      out.push(localizedPath(locale, dtcPath));
    }
  }
  return out;
}
