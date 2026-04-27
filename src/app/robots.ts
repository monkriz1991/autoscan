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

/** Запрещённые для всех (в т.ч. AI) пути: API, OAuth и приватные кабинеты. */
function commonDisallowList(): string[] {
  return [
    "/api/",
    "/api-auth/",
    "/o/",
    ...disallowAllLocales(["/login", "/register"]),
    ...disallowAllLocales(["/account/"]),
    ...disallowAllLocales(["/business/"]),
    ...disallowAllLocales(["/cabinet/"]),
    ...disallowAllLocales(["/superadmin/"]),
  ];
}

/** Явные user-agent: обучающие и поисковые AI-боты (GEO, ChatGPT/Claude search). */
const AI_CRAWLER_USER_AGENTS = [
  "GPTBot",
  "OAI-SearchBot",
  "ClaudeBot",
  "Claude-SearchBot",
  "PerplexityBot",
  "Google-Extended",
] as const;

/** robots.txt через Metadata Route API (Next.js App Router). */
export default function robots(): MetadataRoute.Robots {
  const origin = getSiteOrigin();
  const disallow = commonDisallowList();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow,
      },
      ...AI_CRAWLER_USER_AGENTS.map((userAgent) => ({
        userAgent,
        allow: "/" as const,
        disallow,
      })),
    ],
    sitemap: `${origin}/sitemap.xml`,
  };
}
