import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import JsonLd from "@/components/seo/JsonLd";
import { getBlogPostForLocale } from "@/lib/api";
import { mergeStructuredDataDocs } from "@/lib/seo/structured-data";
import {
  buildBreadcrumbListStructuredData,
  buildStaticBlogArticleStructuredData,
  CANONICAL_SEO_SITE_NAME,
} from "@/lib/seo/static-structured-data";
import { buildOpenGraphTwitterBlock, blogPostOpenGraphImageAbsoluteUrl } from "@/lib/og-metadata";
import { alternateLanguageUrls, generateCanonicalUrlForLocale } from "@/lib/site-url";
import { buildTitle } from "@/lib/seo/titles";
import BlogPostContent from "./BlogPostContent";

type Props = { params: Promise<{ locale: string; slug: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = await getBlogPostForLocale(slug, locale);
  /** Нет поста — тот же 404, что и в странице: без hreflang/canonical на несуществующий slug. */
  if (!post) {
    notFound();
  }
  const t = await getTranslations({ locale, namespace: "seo" });
  const canonicalUrl = generateCanonicalUrlForLocale(locale, `/blog/${slug}`);
  const rawTitle = post.localized_title_raw.trim();
  const seoTitle = buildTitle.blogPost(rawTitle);
  const forceNoindex = !seoTitle || post.is_noindex;
  const titleAbsolute = seoTitle ?? CANONICAL_SEO_SITE_NAME;
  const description = post.excerpt?.trim() || t("blogDescription");

  const routable = new Set<string>(routing.locales);
  const fromApi = (post.available_locales_indexable ?? []).filter((l) => routable.has(l));
  const localesForHreflang = new Set(fromApi);
  localesForHreflang.add(locale);

  const languages: Record<string, string> = {};
  if (!forceNoindex) {
    for (const loc of localesForHreflang) {
      languages[loc] = generateCanonicalUrlForLocale(loc, `/blog/${slug}`);
    }
    languages["x-default"] = localesForHreflang.has("en")
      ? generateCanonicalUrlForLocale("en", `/blog/${slug}`)
      : generateCanonicalUrlForLocale(routing.defaultLocale, `/blog/${slug}`);
  }

  const modifiedForOg = post.updated_at || post.published_at;
  const ogTw = buildOpenGraphTwitterBlock({
    locale,
    title: titleAbsolute,
    description,
    url: canonicalUrl,
    imageUrl: blogPostOpenGraphImageAbsoluteUrl(locale, slug),
    type: "article",
    publishedTime: post.published_at,
    modifiedTime: modifiedForOg,
  });
  return {
    title: { absolute: titleAbsolute },
    description,
    alternates: forceNoindex
      ? { canonical: canonicalUrl }
      : { canonical: canonicalUrl, languages },
    robots: forceNoindex
      ? { index: false, follow: true, googleBot: { index: false, follow: true } }
      : { index: true, follow: true, googleBot: { index: true, follow: true } },
    ...ogTw,
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { locale, slug } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }
  setRequestLocale(locale);
  const post = await getBlogPostForLocale(slug, locale);
  if (!post) {
    notFound();
  }
  const tNav = await getTranslations({ locale, namespace: "nav" });
  const tSeo = await getTranslations({ locale, namespace: "seo" });
  const pageUrl = generateCanonicalUrlForLocale(locale, `/blog/${slug}`);
  const imageForLd = post.cover_image_url ?? blogPostOpenGraphImageAbsoluteUrl(locale, slug);
  const dateModified = post.updated_at || post.published_at;
  const blogPostLd = buildStaticBlogArticleStructuredData({
    pageUrl,
    title: post.title,
    description: post.excerpt?.trim() || tSeo("blogDescription"),
    datePublished: post.published_at,
    dateModified,
    imageAbsoluteUrl: imageForLd,
  });
  const crumbName =
    post.title.length > 120 ? `${post.title.slice(0, 120).trimEnd()}…` : post.title;
  const breadcrumbDoc = buildBreadcrumbListStructuredData(pageUrl, [
    { name: tNav("home"), url: alternateLanguageUrls("")[locale] },
    { name: tNav("blog"), url: alternateLanguageUrls("/blog")[locale] },
    { name: crumbName, url: pageUrl },
  ]);
  const mergedLd = mergeStructuredDataDocs(blogPostLd, breadcrumbDoc);
  return (
    <>
      <JsonLd data={mergedLd} />
      <BlogPostContent post={post} />
    </>
  );
}
