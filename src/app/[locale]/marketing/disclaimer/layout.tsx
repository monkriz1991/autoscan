import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import JsonLd from "@/components/seo/JsonLd";
import { buildLocalePageMetadata } from "@/lib/seo-metadata";
import { buildStaticWebPageStructuredData } from "@/lib/seo/static-structured-data";
import { alternateLanguageUrls } from "@/lib/site-url";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildLocalePageMetadata(locale, "/marketing/disclaimer", "disclaimerTitle", "disclaimerDescription");
}

export default async function DisclaimerLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "seo" });
  const pageUrl = alternateLanguageUrls("/marketing/disclaimer")[locale];
  const webpageLd = buildStaticWebPageStructuredData({
    pageUrl,
    title: t("disclaimerTitle"),
    description: t("disclaimerDescription"),
  });
  return (
    <>
      <JsonLd data={webpageLd} />
      {children}
    </>
  );
}
