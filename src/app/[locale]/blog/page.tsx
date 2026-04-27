import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { buildLocalePageMetadata } from "@/lib/seo-metadata";
import { generateCanonicalUrl, localizedPath } from "@/lib/site-url";
import { getBlogPostsForLocale } from "@/lib/api";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

function firstPageParam(page: string | string[] | undefined): string | undefined {
  if (typeof page === "string" && page.length > 0) return page;
  if (Array.isArray(page) && page[0]) return page[0];
  return undefined;
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const sp = await searchParams;
  const page = firstPageParam(sp.page);
  const base = await buildLocalePageMetadata(
    locale,
    "/blog",
    "blogTitle",
    "blogDescription",
    page ? { canonicalQuery: { page } } : undefined,
  );

  if (!page) {
    return base;
  }

  const qSuffix = `?${new URLSearchParams({ page })}`;
  const languages: Record<string, string> = {};
  for (const loc of routing.locales) {
    languages[loc] = generateCanonicalUrl(`${localizedPath(loc, "/blog")}${qSuffix}`);
  }
  languages["x-default"] = languages[routing.defaultLocale];
  const canonical = languages[locale];

  return {
    ...base,
    alternates: {
      ...base.alternates,
      canonical,
      languages,
    },
    openGraph: {
      ...base.openGraph,
      url: canonical,
    },
  };
}

export default async function BlogIndexPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tSeo = await getTranslations({ locale, namespace: "seo" });
  const t = await getTranslations({ locale, namespace: "blogPage" });
  const posts = await getBlogPostsForLocale(locale).catch((err) => {
    console.error("[BlogIndexPage] failed to load blog posts", err);
    return null;
  });

  return (
    <section className="marketing-page marketing-page--wide">
      <div className="marketing-page__hero">
        <h1 className="marketing-page__hero-title">{t("title")}</h1>
        <p className="marketing-page__hero-sub">{tSeo("blogDescription")}</p>
      </div>

      {posts === null ? (
        <p style={{ color: "#b91c1c" }}>{t("error")}</p>
      ) : posts.length === 0 ? (
        <p style={{ color: "#64748b" }}>{t("empty")}</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
            gap: "1rem",
          }}
        >
          {posts.map((post) => (
            <a
              key={post.slug}
              href={localizedPath(locale, `/blog/${post.slug}`)}
              style={{ textDecoration: "none", color: "inherit", display: "block" }}
            >
              <article
                className="download-option-card"
                style={{
                  minHeight: "100%",
                  overflow: "hidden",
                  padding: "1.25rem",
                  borderRadius: "1rem",
                }}
              >
                {post.cover_image_url ? (
                  <img
                    src={post.cover_image_url}
                    alt={post.title}
                    loading="lazy"
                    style={{
                      display: "block",
                      width: "calc(100% + 2.5rem)",
                      height: 180,
                      objectFit: "cover",
                      margin: "-1.25rem -1.25rem 1rem",
                    }}
                  />
                ) : null}

                <div style={{ display: "grid", gap: "0.65rem" }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
                    {post.published_at ? (
                      <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                        {new Date(post.published_at).toLocaleDateString(locale)}
                      </span>
                    ) : null}
                    {post.available_locales.length > 0 ? (
                      <span
                        style={{
                          borderRadius: 999,
                          background: "rgba(15, 23, 42, 0.08)",
                          color: "#475569",
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          padding: "0.15rem 0.45rem",
                        }}
                      >
                        {post.available_locales.map((l) => l.toUpperCase()).join(", ")}
                      </span>
                    ) : null}
                  </div>
                  <h2 style={{ fontSize: "1.25rem", lineHeight: 1.25, margin: 0 }}>
                    {post.title}
                  </h2>
                  {post.excerpt ? (
                    <p style={{ color: "#64748b", fontSize: "0.95rem", lineHeight: 1.6, margin: 0 }}>
                      {post.excerpt}
                    </p>
                  ) : null}
                </div>
              </article>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
