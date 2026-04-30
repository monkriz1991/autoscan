import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { getSiteOrigin, localizedPath, localeToOpenGraphLocale } from "@/lib/site-url";

/**
 * Абсолютный URL до сегмента .../opengraph-image с учётом localePrefix: as-needed (en без /en/).
 */
function absoluteOpenGraphImageUrl(locale: string, pathWithoutLocale: string): string {
  const localized = localizedPath(locale, pathWithoutLocale);
  const basePath = localized === "/" ? "" : localized.replace(/\/+$/, "");
  return `${getSiteOrigin()}${basePath}/opengraph-image`;
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
      site: "@aiscanauto",
      title: params.title,
      description: params.description,
      images: [
        {
          url: params.imageUrl,
          alt: params.title,
        },
      ],
    },
  };
}

/** Абсолютный URL opengraph-image.tsx у корня локали (mock UI + tagline). */
export function staticOpenGraphImageAbsoluteUrl(locale: string): string {
  return absoluteOpenGraphImageUrl(locale, "");
}

/** Абсолютный URL динамического OG для DTC. */
export function dtcOpenGraphImageAbsoluteUrl(locale: string, code: string): string {
  return absoluteOpenGraphImageUrl(locale, `/dtc/${code.toUpperCase()}`);
}

/** OG-картинка для поста блога (отдельный opengraph-image в сегменте [slug]). */
export function blogPostOpenGraphImageAbsoluteUrl(locale: string, slug: string): string {
  return absoluteOpenGraphImageUrl(locale, `/blog/${slug}`);
}
