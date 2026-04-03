import type { MetadataRoute } from "next";
import { getSiteOrigin } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const origin = getSiteOrigin();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/cabinet/", "/checkout/", "/business/", "/account/", "/superadmin/", "/api/"],
    },
    sitemap: `${origin}/sitemap.xml`,
  };
}
