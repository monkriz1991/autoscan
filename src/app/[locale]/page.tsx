import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import JsonLd from "@/components/seo/JsonLd";
import HomePageShell from "@/components/landing/HomePageShell";
import { routing } from "@/i18n/routing";
import { buildLocalePageMetadata } from "@/lib/seo-metadata";
import { alternateLanguageUrls } from "@/lib/site-url";
import {
  fetchStructuredData,
  mergeStructuredDataDocs,
  withStructuredDataFallback,
} from "@/lib/seo/structured-data";
import {
  buildStaticGlobalStructuredData,
  buildStaticHomeWithSoftwareStructuredData,
} from "@/lib/seo/static-structured-data";

/** ISR: SEO JSON-LD с бэкенда; при сбое — статический граф. */
export const revalidate = 600;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildLocalePageMetadata(locale, "", "homeTitle", "homeDescription");
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "seo" });
  const pageUrl = alternateLanguageUrls("")[locale];
  const title = t("homeTitle");
  const description = t("homeDescription");

  const remoteRaw = await fetchStructuredData({
    bundles: ["home", "download"],
    locale,
    pageUrl,
    title,
    description,
  });
  const fallback = buildStaticHomeWithSoftwareStructuredData({
    pageUrl,
    locale,
    title,
    description,
  });
  const pageLd = withStructuredDataFallback(remoteRaw, fallback);
  const homeJsonLd = mergeStructuredDataDocs(buildStaticGlobalStructuredData(), pageLd);

  return (
    <>
      <JsonLd data={homeJsonLd} />
      <HomePageShell locale={locale} />
    </>
  );
}
