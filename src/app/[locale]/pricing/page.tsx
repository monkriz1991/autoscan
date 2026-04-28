import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import JsonLd from "@/components/seo/JsonLd";
import { buildStaticWebPageStructuredData } from "@/lib/seo/static-structured-data";
import { buildLocalePageMetadata } from "@/lib/seo-metadata";
import { alternateLanguageUrls } from "@/lib/site-url";
import { routing } from "@/i18n/routing";
import PricingPageClient from "./PricingPageClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildLocalePageMetadata(locale, "/pricing", "pricingTitle", "pricingDescription");
}

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "seo" });
  const pageUrl = alternateLanguageUrls("/pricing")[locale];
  const pricingLd = buildStaticWebPageStructuredData({
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

export function generateStaticParams() {
  return routing.locales.map((loc) => ({ locale: loc }));
}
