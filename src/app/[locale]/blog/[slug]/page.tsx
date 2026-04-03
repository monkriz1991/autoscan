import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { setRequestLocale } from "next-intl/server";
import JsonLd from "@/components/seo/JsonLd";
import { getBlogPostForLocale } from "@/lib/api";
import { fetchStructuredData } from "@/lib/seo/structured-data";
import { alternateLanguageUrls, getSiteOrigin, localeToOpenGraphLocale } from "@/lib/site-url";
import BlogPostContent from "./BlogPostContent";

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = await getBlogPostForLocale(slug, locale);
  if (!post) {
    const t = await getTranslations({ locale, namespace: "seo" });
    return {
      title: t("blogPostNotFoundTitle"),
      robots: { index: false, follow: true },
    };
  }
  const pathSuffix = `/blog/${slug}`;
  const languages = alternateLanguageUrls(pathSuffix);
  const url = languages[locale];
  const description =
    post.excerpt.length > 0 ? post.excerpt.slice(0, 160) : post.title;
  let image: string | undefined;
  if (post.cover_image_url) {
    const raw = post.cover_image_url;
    image = raw.startsWith("http")
      ? raw
      : `${getSiteOrigin()}${raw.startsWith("/") ? "" : "/"}${raw}`;
  }
  return {
    title: post.title,
    description,
    alternates: { canonical: url, languages },
    openGraph: {
      type: "article",
      title: post.title,
      description,
      url,
      locale: localeToOpenGraphLocale(locale),
      publishedTime: post.published_at || undefined,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const pathSuffix = `/blog/${slug}`;
  const languages = alternateLanguageUrls(pathSuffix);
  const pageUrl = languages[locale];
  const postLd = await fetchStructuredData({
    bundles: ["blog_post"],
    locale,
    pageUrl,
    slug,
  });

  return (
    <>
      <JsonLd data={postLd} />
      <Suspense fallback={null}>
        <BlogPostContent slug={slug} />
      </Suspense>
    </>
  );
}
