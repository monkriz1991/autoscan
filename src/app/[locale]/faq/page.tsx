import type { Metadata } from "next";
import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import JsonLd from "@/components/seo/JsonLd";
import { buildLocalePageMetadata } from "@/lib/seo-metadata";
import { fetchStructuredData } from "@/lib/seo/structured-data";
import { alternateLanguageUrls } from "@/lib/site-url";
import FaqPageContent from "./FaqPageContent";

type Props = { params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return buildLocalePageMetadata(locale, "/faq", "faqTitle", "faqDescription");
}

export default async function FaqPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const pageUrl = alternateLanguageUrls("/faq")[locale];
  const faqLd = await fetchStructuredData({
    bundles: ["faq"],
    locale,
    pageUrl,
  });
  return (
    <>
      <JsonLd data={faqLd} />
      <Suspense fallback={null}>
        <FaqPageContent />
      </Suspense>
    </>
  );
}
