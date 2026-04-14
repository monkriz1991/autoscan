import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { getBlogPostForLocale } from "@/lib/api";
import { alternateLanguageUrls, localeToOpenGraphLocale } from "@/lib/site-url";
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
  return {
    title: post.title,
    description,
    alternates: { canonical: url, languages },
    openGraph: {
      title: post.title,
      description,
      url,
      type: "article",
      locale: localeToOpenGraphLocale(locale),
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
    },
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
  return <BlogPostContent post={post} />;
}
