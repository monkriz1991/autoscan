import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getBlogPostsForLocale } from "@/lib/api";
import { alternateLanguageUrls } from "@/lib/site-url";

const PATH = "/blog";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });
  return {
    title: t("blogTitle"),
    description: t("blogDescription"),
    alternates: { languages: alternateLanguageUrls(PATH) },
  };
}

export default async function BlogIndexPage({ params }: Props) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "blogPage" });

  let posts: Awaited<ReturnType<typeof getBlogPostsForLocale>> = [];
  let failed = false;
  try {
    posts = await getBlogPostsForLocale(locale);
  } catch {
    failed = true;
  }

  if (failed) {
    return (
      <div className="marketing-page marketing-page--wide">
        <div className="marketing-page__hero">
          <h1 className="marketing-page__hero-title">{t("title")}</h1>
          <p className="marketing-page__hero-sub">{t("error")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="marketing-page marketing-page--wide">
      <div className="marketing-page__hero">
        <h1 className="marketing-page__hero-title">{t("title")}</h1>
        <p className="marketing-page__hero-sub">{t("subtitle")}</p>
      </div>

      {posts.length === 0 ? (
        <p className="marketing-page__hero-sub" style={{ textAlign: "center" }}>
          {t("empty")}
        </p>
      ) : (
        <div className="blog-card-grid">
          {posts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="blog-card">
              <div className="blog-card__media">
                {post.cover_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element -- внешний URL с API
                  <img src={post.cover_image_url} alt={post.title} width={640} height={360} />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      minHeight: 160,
                      background:
                        "linear-gradient(135deg, rgba(59,130,246,0.25), rgba(147,51,234,0.2))",
                    }}
                  />
                )}
              </div>
              <div className="blog-card__body">
                <time className="blog-card__date" dateTime={post.published_at}>
                  {post.published_at
                    ? new Date(post.published_at).toLocaleDateString(locale)
                    : ""}
                </time>
                <h2 className="blog-card__title">{post.title}</h2>
                {post.excerpt ? <p className="blog-card__excerpt">{post.excerpt}</p> : null}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
