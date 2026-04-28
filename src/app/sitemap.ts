import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { getBlogPostsForLocale } from "@/lib/api";
import { allLocalizedSitemapPaths } from "@/lib/sitemap-static-paths";
import { getSiteOrigin, localizedPath } from "@/lib/site-url";

function priorityForPath(path: string): number {
  if (path === "/" || path.match(/^\/(ru|de|pl|es|it)\/?$/)) return path === "/" ? 1 : 0.95;
  if (path === "/pricing" || /^\/(ru|de|pl|es|it)\/pricing$/.test(path)) return 0.9;
  if (path.includes("/dtc/")) return 0.7;
  return 0.8;
}

/** lastModified для поста блога; при битой дате — «сейчас», как у статических путей. */
function lastModifiedForBlogPost(publishedAt: string, fallback: Date): Date {
  const d = new Date(publishedAt);
  return Number.isNaN(d.getTime()) ? fallback : d;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = getSiteOrigin();
  const now = new Date();
  const paths = allLocalizedSitemapPaths();

  const staticEntries: MetadataRoute.Sitemap = paths.map((path) => {
    const url = path === "/" ? `${origin}/` : `${origin}${path}`;
    return {
      url,
      lastModified: now,
      changeFrequency: path.includes("/dtc/") ? ("monthly" as const) : ("weekly" as const),
      priority: priorityForPath(path),
    };
  });

  let posts: Awaited<ReturnType<typeof getBlogPostsForLocale>> = [];
  try {
    posts = await getBlogPostsForLocale(routing.defaultLocale);
  } catch {
    // API недоступен при сборке — отдаём хотя бы статические URL
    posts = [];
  }

  const blogEntries: MetadataRoute.Sitemap = [];
  for (const post of posts) {
    if (!post.slug) continue;
    for (const locale of routing.locales) {
      if (!post.available_locales.includes(locale)) continue;
      const path = localizedPath(locale, `/blog/${post.slug}`);
      const url = path === "/" ? `${origin}/` : `${origin}${path}`;
      blogEntries.push({
        url,
        lastModified: lastModifiedForBlogPost(post.published_at, now),
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  }

  return [...staticEntries, ...blogEntries];
}
