import type { MetadataRoute } from "next";
import { getSiteOrigin } from "@/lib/site-url";

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
        "/register",
        "/logout",
      ],
    },
    sitemap: `${origin}/sitemap.xml`,
  };
}
