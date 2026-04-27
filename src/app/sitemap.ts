import type { MetadataRoute } from "next";
import { getSiteOrigin, localizedPath } from "@/lib/site-url";
import { routing } from "@/i18n/routing";

const STATIC_PATHS = [
  "",
  "/faq",
  "/download",
  "/marketing/pricing",
  "/marketing/compare-obd2-apps",
  "/marketing/contacts",
  "/marketing/privacy",
  "/marketing/terms",
  "/marketing/disclaimer",
  "/business",
];

export default function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = getSiteOrigin();
  const lastModified = process.env.NEXT_PUBLIC_LAST_MODIFIED_DATE
    ? new Date(process.env.NEXT_PUBLIC_LAST_MODIFIED_DATE)
    : new Date();

  const entries: MetadataRoute.Sitemap = [];
  for (const path of STATIC_PATHS) {
    for (const locale of routing.locales) {
      const pathname = localizedPath(locale, path);
      entries.push({
        url: `${origin}${pathname}`,
        lastModified,
      });
    }
  }

  return Promise.resolve(entries);
}
