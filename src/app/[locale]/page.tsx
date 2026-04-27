import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import JsonLd from "@/components/seo/JsonLd";
import StaticJsonLd from "@/components/landing/StaticJsonLd";
import { buildOpenGraphTwitterBlock, staticOpenGraphImageAbsoluteUrl } from "@/lib/og-metadata";
import { getCanonicalUrlFromRequestHeaders } from "@/lib/request-canonical";
import { buildLocalePageMetadata } from "@/lib/seo-metadata";
import {
  fetchStructuredData,
  withStructuredDataFallback,
} from "@/lib/seo/structured-data";
import { buildStaticHomeStructuredData } from "@/lib/seo/static-structured-data";
import { alternateLanguageUrls, getSiteOrigin } from "@/lib/site-url";
import HomePageClient from "./HomePageClient";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = routing.locales.includes(rawLocale as (typeof routing.locales)[number])
    ? rawLocale
    : routing.defaultLocale;
  const base = await buildLocalePageMetadata(locale, "", "homeTitle", "homeDescription");
  const t = await getTranslations({ locale, namespace: "seo" });
  const canonicalUrl = await getCanonicalUrlFromRequestHeaders(locale);
  const keywords = t("homeKeywords")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const ogTw = buildOpenGraphTwitterBlock({
    locale,
    title: t("homeOgTitle"),
    description: t("homeOgDescription"),
    url: canonicalUrl,
    imageUrl: staticOpenGraphImageAbsoluteUrl(locale),
  });

  return {
    ...base,
    title: { absolute: t("homeTitle") },
    alternates: {
      ...base.alternates,
      canonical: canonicalUrl,
    },
    keywords,
    ...ogTw,
    twitter: {
      ...ogTw.twitter,
      title: t("homeTwitterTitle"),
      description: t("homeTwitterDescription"),
    },
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = routing.locales.includes(rawLocale as (typeof routing.locales)[number])
    ? rawLocale
    : routing.defaultLocale;
  setRequestLocale(locale);
  const tSeo = await getTranslations({ locale, namespace: "seo" });
  const tLand = await getTranslations({ locale, namespace: "landing" });
  const tNav = await getTranslations({ locale, namespace: "nav" });
  const homeAlternates = alternateLanguageUrls("");
  const pageUrl = homeAlternates[locale] || homeAlternates[routing.defaultLocale] || `${getSiteOrigin()}/`;
  const pageUrlNoSlash = pageUrl.replace(/\/$/, "");
  const homeTitle = tSeo("homeTitle");
  const homeDescription = tSeo("homeDescription");
  const homeLdRaw = await fetchStructuredData({
    bundles: ["home"],
    locale,
    pageUrl,
    title: homeTitle,
    description: homeDescription,
  });
  const homeLd = withStructuredDataFallback(
    homeLdRaw,
    buildStaticHomeStructuredData({
      pageUrl,
      title: homeTitle,
      description: homeDescription,
    }),
  );

  const softwareApplicationLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": `${pageUrlNoSlash}/#softwareapplication`,
    name: "AIscanAuto",
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Windows, macOS, Linux",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    description: tLand("schema.softwareDescription"),
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.5",
      ratingCount: tLand("schema.ratingCount"),
    },
  };

  const howToLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: tLand("howTo.name"),
    step: [1, 2, 3].map((n) => ({
      "@type": "HowToStep",
      position: n,
      name: tLand(`howTo.s${n}.name` as never),
      text: tLand(`howTo.s${n}.text` as never),
    })),
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: tNav("home"),
        item: pageUrl,
      },
    ],
  };

  return (
    <>
      <JsonLd data={homeLd} />
      <StaticJsonLd data={softwareApplicationLd} />
      <StaticJsonLd data={howToLd} />
      <StaticJsonLd data={breadcrumbLd} />
      <HomePageClient />
    </>
  );
}
