import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import StaticJsonLd from "@/components/landing/StaticJsonLd";
import JsonLd from "@/components/seo/JsonLd";
import { getBlogPostForLocale } from "@/lib/api";
import { fetchStructuredData } from "@/lib/seo/structured-data";
import { buildOpenGraphTwitterBlock, blogPostOpenGraphImageAbsoluteUrl } from "@/lib/og-metadata";
import { alternateLanguageUrls } from "@/lib/site-url";
import BlogPostContent from "./BlogPostContent";

type Props = { params: Promise<{ locale: string; slug: string }> };

export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = await getBlogPostForLocale(slug, locale);
  const t = await getTranslations({ locale, namespace: "seo" });
  if (!post) {
    return { title: t("blogPostNotFoundTitle") };
  }
  const languages = alternateLanguageUrls(`/blog/${slug}`);
  const url = languages[locale];
  const description = post.excerpt?.trim() || t("blogDescription");
  const ogTw = buildOpenGraphTwitterBlock({
    locale,
    title: post.title,
    description,
    url,
    imageUrl: blogPostOpenGraphImageAbsoluteUrl(locale, slug),
    type: "article",
  });
  return {
    title: post.title,
    description,
    alternates: { canonical: url, languages },
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
  const pageUrl = alternateLanguageUrls(`/blog/${slug}`)[locale];
  const blogPostLd = await fetchStructuredData({
    bundles: ["blog_post"],
    locale,
    pageUrl,
    slug,
    title: post.title,
    description: post.excerpt?.trim() || tSeo("blogDescription"),
  });
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: tNav("home"), item: alternateLanguageUrls("")[locale] },
      { "@type": "ListItem", position: 2, name: tSeo("blogTitle"), item: alternateLanguageUrls("/blog")[locale] },
      { "@type": "ListItem", position: 3, name: post.title, item: pageUrl },
    ],
  };
  return (
    <>
      <JsonLd data={blogPostLd} />
      <StaticJsonLd data={breadcrumbLd} />
      <BlogPostContent post={post} />
    </>
  );
}
