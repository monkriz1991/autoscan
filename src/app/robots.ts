import type { MetadataRoute } from "next";
import { SUPPORTED_LOCALES, routing } from "@/i18n/routing";
import { getSiteOrigin } from "@/lib/site-url";

/** Служебные OG-маршруты Next.js — не для индексации (картинки всё ещё доступны для og:image). */
function openGraphImageDisallowPaths(): string[] {
  const paths = [
    "/opengraph-image",
    "/dtc/*/opengraph-image",
    "/blog/*/opengraph-image",
  ];
  for (const locale of SUPPORTED_LOCALES) {
    if (locale === routing.defaultLocale) continue;
    paths.push(`/${locale}/opengraph-image`);
    paths.push(`/${locale}/dtc/*/opengraph-image`);
    paths.push(`/${locale}/blog/*/opengraph-image`);
  }
  return paths;
}

/** Публичная индексация маркетинговых страниц; служебные разделы закрыты. */
export default function robots(): MetadataRoute.Robots {
  const origin = getSiteOrigin();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/cabinet/",
        "/account/",
        "/billing/",
        "/business/",
        "/checkout/",
        "/widget/",
        "/auth/",
        "/superadmin/",
        "/admin/",
        "/login",
        "/logout",
        ...openGraphImageDisallowPaths(),
      ],
    },
    sitemap: `${origin}/sitemap.xml`,
  };
}
