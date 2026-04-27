import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { localizedPath } from "@/lib/site-url";
import { getSiteOrigin } from "@/lib/site-url";

/** Пути без локали → все варианты с префиксом локали (as-needed для en). */
function disallowAllLocales(paths: string[]): string[] {
  const out: string[] = [];
  for (const p of paths) {
    for (const locale of routing.locales) {
      out.push(localizedPath(locale, p));
    }
  }
  return out;
}

/** robots.txt через Metadata Route API (Next.js App Router). */
export default function robots(): MetadataRoute.Robots {
  const origin = getSiteOrigin();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/api-auth/",
          "/o/",
          ...disallowAllLocales(["/login", "/register"]),
          ...disallowAllLocales(["/account/"]),
          ...disallowAllLocales(["/business/"]),
          ...disallowAllLocales(["/cabinet/"]),
        ],
      },
    ],
    sitemap: `${origin}/sitemap.xml`,
  };
}
