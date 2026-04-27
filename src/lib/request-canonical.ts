import { headers } from "next/headers";
import {
  MIDDLEWARE_CANONICAL_SEARCH_HEADER,
  MIDDLEWARE_PATHNAME_HEADER,
} from "@/lib/middleware-pathname";
import { generateCanonicalUrl, localizedPath } from "@/lib/site-url";

/**
 * Абсолютный canonical из заголовков middleware (путь без префикса локали + query без UTM)
 * и текущей локали страницы — чтобы главная /de не сливалась с /.
 */
export async function getCanonicalUrlFromRequestHeaders(locale: string): Promise<string> {
  const h = await headers();
  const pathHeader = h.get(MIDDLEWARE_PATHNAME_HEADER) || "/";
  const pathNoLocale =
    pathHeader === "/" || pathHeader === "" ? "" : pathHeader.startsWith("/") ? pathHeader : `/${pathHeader}`;
  const searchRaw = h.get(MIDDLEWARE_CANONICAL_SEARCH_HEADER) || "";
  const localized = localizedPath(locale, pathNoLocale);
  return generateCanonicalUrl(`${localized}${searchRaw ? `?${searchRaw}` : ""}`);
}
