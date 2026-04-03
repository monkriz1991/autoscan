import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import JsonLd from "@/components/seo/JsonLd";
import { buildLocalePageMetadata } from "@/lib/seo-metadata";
import { fetchStructuredData } from "@/lib/seo/structured-data";
import { alternateLanguageUrls } from "@/lib/site-url";
import HomePageClient from "./HomePageClient";

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

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "seo" });
  const pageUrl = alternateLanguageUrls("")[locale];
  const homeLd = await fetchStructuredData({
    bundles: ["home"],
    locale,
    pageUrl,
    title: t("homeTitle"),
    description: t("homeDescription"),
  });
  return (
    <>
      <JsonLd data={homeLd} />
      <HomePageClient />
    </>
  );
}
