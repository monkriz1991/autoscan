import { getTranslations } from "next-intl/server";
import { getBlogPostsForLocale } from "@/lib/api";
import { localizedPath } from "@/lib/site-url";

type Props = { locale: string };

/** Список постов — отдельный async RSC, hero страницы не ждёт GET /blog/. */
export default async function BlogIndexPosts({ locale }: Props) {
  const t = await getTranslations({ locale, namespace: "blogPage" });
  const posts = await getBlogPostsForLocale(locale).catch((err) => {
    console.error("[BlogIndexPosts] failed to load blog posts", err);
    return null;
  });

  if (posts === null) {
    return <p style={{ color: "#b91c1c" }}>{t("error")}</p>;
  }
  if (posts.length === 0) {
    return <p style={{ color: "#64748b" }}>{t("empty")}</p>;
  }

  return (
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
              <h2 style={{ fontSize: "1.25rem", lineHeight: 1.25, margin: 0 }}>{post.title}</h2>
              {post.excerpt ? (
                <p style={{ color: "#64748b", fontSize: "0.95rem", lineHeight: 1.6, margin: 0 }}>{post.excerpt}</p>
              ) : null}
            </div>
          </article>
        </a>
      ))}
    </div>
  );
}
