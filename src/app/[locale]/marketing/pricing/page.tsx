import { getTranslations, setRequestLocale } from "next-intl/server";
import JsonLd from "@/components/seo/JsonLd";
import { fetchStructuredData } from "@/lib/seo/structured-data";
import { alternateLanguageUrls } from "@/lib/site-url";
import PricingPageClient from "./PricingPageClient";

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
