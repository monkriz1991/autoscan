import type { MetadataRoute } from "next";
import { getSiteOrigin } from "@/lib/site-url";
import { allLocalizedSitemapPaths } from "@/lib/sitemap-static-paths";

function priorityForPath(path: string): number {
  if (path === "/" || path.match(/^\/(ru|de|pl|es|it)\/?$/)) return path === "/" ? 1 : 0.95;
  if (path === "/pricing" || /^\/(ru|de|pl|es|it)\/pricing$/.test(path)) return 0.9;
  if (path.includes("/dtc/")) return 0.7;
  return 0.8;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = getSiteOrigin();
  const now = new Date();
  const paths = allLocalizedSitemapPaths();

  return paths.map((path) => {
    const url = path === "/" ? `${origin}/` : `${origin}${path}`;
    return {
      url,
      lastModified: now,
      changeFrequency: path.includes("/dtc/") ? ("monthly" as const) : ("weekly" as const),
      priority: priorityForPath(path),
    };
  });
}
