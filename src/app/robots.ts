import type { MetadataRoute } from "next";
import { getSiteOrigin } from "@/lib/site-url";

/** Публичная индексация маркетинговых страниц; служебные разделы закрыты. */
export default function robots(): MetadataRoute.Robots {
  const origin = getSiteOrigin();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/dashboard/"],
    },
    sitemap: `${origin}/sitemap.xml`,
  };
}
