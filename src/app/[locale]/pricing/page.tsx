import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import JsonLd from "@/components/seo/JsonLd";
import { getPlansForLocale } from "@/lib/api";
import { buildPricingStructuredDataFromPlans } from "@/lib/seo/pricing-structured-fallback";
import {
  fetchStructuredData,
  mergeStructuredDataDocs,
  pricingRemoteOrNullForMerge,
  withStructuredDataFallback,
} from "@/lib/seo/structured-data";
import { buildStaticGlobalStructuredData } from "@/lib/seo/static-structured-data";
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
  const title = t("pricingTitle");
  const description = t("pricingDescription");

  const [remoteRaw, plans] = await Promise.all([
    fetchStructuredData({
      bundles: ["pricing"],
      locale,
      pageUrl,
      title,
      description,
    }),
    getPlansForLocale(locale).catch(() => []),
  ]);

  const remote = pricingRemoteOrNullForMerge(remoteRaw);
  const fallbackDoc = buildPricingStructuredDataFromPlans(plans, pageUrl, title, description);
  const pageLd = withStructuredDataFallback(remote, fallbackDoc);
  const pricingJsonLd = mergeStructuredDataDocs(buildStaticGlobalStructuredData(), pageLd);

  return (
    <>
      <JsonLd data={pricingJsonLd} />
      <PricingPageClient />
    </>
  );
}

export function generateStaticParams() {
  return routing.locales.map((loc) => ({ locale: loc }));
}
