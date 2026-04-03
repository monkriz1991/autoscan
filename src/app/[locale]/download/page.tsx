import type { Metadata } from "next";
import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import JsonLd from "@/components/seo/JsonLd";
import { buildLocalePageMetadata } from "@/lib/seo-metadata";
import { fetchStructuredData } from "@/lib/seo/structured-data";
import { alternateLanguageUrls } from "@/lib/site-url";
import DownloadPageContent from "./DownloadPageContent";

type Props = { params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return buildLocalePageMetadata(locale, "/download", "downloadTitle", "downloadDescription");
}

export default async function DownloadPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const pageUrl = alternateLanguageUrls("/download")[locale];
  const downloadLd = await fetchStructuredData({
    bundles: ["download"],
    locale,
    pageUrl,
    clientOs: "unknown",
  });
  return (
    <>
      <JsonLd data={downloadLd} />
      <Suspense fallback={null}>
        <DownloadPageContent />
      </Suspense>
    </>
  );
}
