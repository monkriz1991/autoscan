import { routing } from "@/i18n/routing";
import { isNoindexUtilityPath } from "@/lib/middleware-pathname";
import { getSiteOrigin, localizedPath, normalizePathForSeo, pathWithoutLocaleSegment } from "@/lib/site-url";

export type HreflangLink = {
  hreflang: string;
  href: string;
};

type BuildHreflangOptions = {
  pageParam?: number;
  noindex?: boolean;
};

function buildUrl(locale: string, pathname: string, pageParam?: number): string {
  const normalizedPath = normalizePathForSeo(pathWithoutLocaleSegment(pathname));
  const localized = localizedPath(locale, normalizedPath);
  const query = pageParam && pageParam > 0 ? `?page=${pageParam}` : "";
  return `${getSiteOrigin()}${localized}${query}`;
}

export function isNoindexPage(pathname: string, options?: { noindex?: boolean }): boolean {
  if (options?.noindex) {
    return true;
  }
  return isNoindexUtilityPath(pathname);
}

export function buildHreflangLinks(pathname: string, options?: BuildHreflangOptions): HreflangLink[] {
  if (isNoindexPage(pathname, { noindex: options?.noindex })) {
    return [];
  }

  const links = routing.locales.map((locale) => ({
    hreflang: locale,
    href: buildUrl(locale, pathname, options?.pageParam),
  }));

  // Self-reference по каждой локали + x-default в конце (как в sitemap / рекомендациях).
  return [
    ...links,
    {
      hreflang: "x-default",
      href: buildUrl(routing.defaultLocale, pathname, options?.pageParam),
    },
  ];
}
