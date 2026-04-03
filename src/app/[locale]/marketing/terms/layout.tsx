import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import JsonLd from "@/components/seo/JsonLd";
import { buildLocalePageMetadata } from "@/lib/seo-metadata";
import { fetchStructuredData } from "@/lib/seo/structured-data";
import { alternateLanguageUrls } from "@/lib/site-url";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildLocalePageMetadata(locale, "/marketing/terms", "termsTitle", "termsDescription");
}

export default async function TermsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "seo" });
  const pageUrl = alternateLanguageUrls("/marketing/terms")[locale];
  const webpageLd = await fetchStructuredData({
    bundles: ["webpage"],
    locale,
    pageUrl,
    title: t("termsTitle"),
    description: t("termsDescription"),
  });
  return (
    <>
      <JsonLd data={webpageLd} />
      {children}
    </>
  );
}
