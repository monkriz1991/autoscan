import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import JsonLd from "@/components/seo/JsonLd";
import { buildLocalePageMetadata } from "@/lib/seo-metadata";
import { fetchStructuredData } from "@/lib/seo/structured-data";
import { alternateLanguageUrls } from "@/lib/site-url";
import BlogPageContent from "./BlogPageContent";

type Props = { params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return buildLocalePageMetadata(locale, "/blog", "blogTitle", "blogDescription");
}

export default async function BlogPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "seo" });
  const pageUrl = alternateLanguageUrls("/blog")[locale];
  const blogListLd = await fetchStructuredData({
    bundles: ["blog_list"],
    locale,
    pageUrl,
    title: t("blogTitle"),
    description: t("blogDescription"),
  });
  return (
    <>
      <JsonLd data={blogListLd} />
      <Suspense fallback={null}>
        <BlogPageContent />
      </Suspense>
    </>
  );
}
