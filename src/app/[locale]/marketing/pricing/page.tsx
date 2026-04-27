import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import JsonLd from "@/components/seo/JsonLd";
import { fetchStructuredData } from "@/lib/seo/structured-data";
import { buildLocalePageMetadata } from "@/lib/seo-metadata";
import { alternateLanguageUrls } from "@/lib/site-url";
import PricingPageClient from "./PricingPageClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildLocalePageMetadata(locale, "/marketing/pricing", "pricingTitle", "pricingDescription");
}

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "seo" });
  const pageUrl = alternateLanguageUrls("/marketing/pricing")[locale];
  const pricingLd = await fetchStructuredData({
    bundles: ["pricing"],
    locale,
    pageUrl,
    title: t("pricingTitle"),
    description: t("pricingDescription"),
  });
  return (
    <>
      <JsonLd data={pricingLd} />
      <PricingPageClient />
    </>
  );
}
