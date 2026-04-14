import type { MetadataRoute } from "next";
import { fetchBlogSlugsForSitemap } from "@/lib/blog-sitemap";
import { routing } from "@/i18n/routing";
import { alternateLanguageUrls } from "@/lib/site-url";

/** Публичные маршруты без префикса локали (главная — ""). */
const STATIC_PATHS = [
  "",
  "/faq",
  "/download",
  "/marketing/pricing",
  "/marketing/compare-obd2-apps",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const items: MetadataRoute.Sitemap = [];

  for (const path of STATIC_PATHS) {
    const languages = alternateLanguageUrls(path);
    items.push({
      url: languages[routing.defaultLocale],
      lastModified: new Date(),
      alternates: { languages },
    });
  }

  const slugs = await fetchBlogSlugsForSitemap();
  for (const slug of slugs) {
    const languages = alternateLanguageUrls(`/blog/${slug}`);
    items.push({
      url: languages[routing.defaultLocale],
      lastModified: new Date(),
      alternates: { languages },
    });
  }

  return items;
}
