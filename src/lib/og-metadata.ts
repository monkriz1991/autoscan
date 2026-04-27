import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { getSiteOrigin, localizedPath, localeToOpenGraphLocale } from "@/lib/site-url";

/** Нормализованный путь страницы без хвостового «/». */
function localizedPathNormalized(locale: string, pathWithoutLocale: string): string {
  const raw = localizedPath(locale, pathWithoutLocale);
  if (raw === "/" || raw === "") return "";
  return raw.replace(/\/+$/, "");
}

/**
 * Префикс URL для opengraph-image: при as-needed для en в дереве файлов остаётся сегмент /en/...
 */
function openGraphImagePathPrefix(locale: string, pathWithoutLocale: string): string {
  const p = localizedPathNormalized(locale, pathWithoutLocale);
  if (locale === routing.defaultLocale) {
    if (!p) return `/${routing.defaultLocale}`;
    if (!p.startsWith(`/${routing.defaultLocale}/`)) {
      return `/${routing.defaultLocale}${p}`;
    }
    return p;
  }
  if (!p) return `/${locale}`;
  return p;
}

/**
 * Блок Open Graph + Twitter Card с мультиязычными og:locale / og:locale:alternate.
 * Использует Metadata API Next.js (без next/head).
 */
export function buildOpenGraphTwitterBlock(params: {
  locale: string;
  title: string;
  description: string;
  url: string;
  imageUrl: string;
  type?: "website" | "article";
}): Pick<Metadata, "openGraph" | "twitter"> {
  const alternateLocale = routing.locales
    .filter((l) => l !== params.locale)
    .map((l) => localeToOpenGraphLocale(l));

  return {
    openGraph: {
      title: params.title,
      description: params.description,
      url: params.url,
      siteName: "AIscanAuto",
      type: params.type ?? "website",
      locale: localeToOpenGraphLocale(params.locale),
      alternateLocale,
      images: [
        {
          url: params.imageUrl,
          width: 1200,
          height: 630,
          alt: params.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: params.title,
      description: params.description,
      images: [params.imageUrl],
    },
  };
}

/** Абсолютный URL opengraph-image.tsx у корня локали (mock UI + tagline). */
export function staticOpenGraphImageAbsoluteUrl(locale: string): string {
  return `${getSiteOrigin()}${openGraphImagePathPrefix(locale, "")}/opengraph-image`;
}

/** Абсолютный URL динамического OG для DTC. */
export function dtcOpenGraphImageAbsoluteUrl(locale: string, code: string): string {
  return `${getSiteOrigin()}${openGraphImagePathPrefix(locale, `/dtc/${code.toUpperCase()}`)}/opengraph-image`;
}

/** OG-картинка для поста блога (отдельный opengraph-image в сегменте [slug]). */
export function blogPostOpenGraphImageAbsoluteUrl(locale: string, slug: string): string {
  return `${getSiteOrigin()}${openGraphImagePathPrefix(locale, `/blog/${slug}`)}/opengraph-image`;
}
