import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { buildLocalePageMetadata } from "@/lib/seo-metadata";
import { generateCanonicalUrl, localizedPath } from "@/lib/site-url";
import BlogIndexPosts from "./BlogIndexPosts";
import BlogPostsSkeleton from "./BlogPostsSkeleton";

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

  return (
    <section className="marketing-page marketing-page--wide">
      <div className="marketing-page__hero">
        <h1 className="marketing-page__hero-title">{t("title")}</h1>
        <p className="marketing-page__hero-sub">{tSeo("blogDescription")}</p>
      </div>

      <Suspense fallback={<BlogPostsSkeleton />}>
        <BlogIndexPosts locale={locale} />
      </Suspense>
    </section>
  );
}
