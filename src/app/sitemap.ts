import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { getSiteOrigin } from "@/lib/site-url";

const STATIC_PATHS = [
  "",
  "/marketing/pricing",
  "/faq",
  "/download",
  "/blog",
  "/marketing/terms",
  "/marketing/privacy",
  "/marketing/contacts",
  "/marketing/disclaimer",
  "/login",
  "/register",
];

async function fetchBlogSlugs(): Promise<string[]> {
  try {
    const base = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8001/api/v1").replace(
      /\/$/,
      "",
    );
    const res = await fetch(`${base}/blog/`, {
      next: { revalidate: 3600 },
      headers: { "Accept-Language": "en", "X-Locale": "en" },
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data
      .map((row: { slug?: string }) => String(row.slug ?? ""))
      .filter((s) => s.length > 0);
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = getSiteOrigin();
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of routing.locales) {
    for (const p of STATIC_PATHS) {
      entries.push({
        url: `${origin}/${locale}${p}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: p === "" ? 1 : 0.75,
      });
    }
  }

  const slugs = await fetchBlogSlugs();
  for (const locale of routing.locales) {
    for (const slug of slugs) {
      entries.push({
        url: `${origin}/${locale}/blog/${encodeURIComponent(slug)}`,
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 0.65,
      });
    }
  }

  return entries;
}
