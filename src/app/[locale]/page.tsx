import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import JsonLd from "@/components/seo/JsonLd";
import StaticJsonLd from "@/components/landing/StaticJsonLd";
import { buildLocalePageMetadata } from "@/lib/seo-metadata";
import { fetchStructuredData } from "@/lib/seo/structured-data";
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
  const { locale } = await params;
  const base = await buildLocalePageMetadata(locale, "", "homeTitle", "homeDescription");
  const t = await getTranslations({ locale, namespace: "seo" });
  const origin = getSiteOrigin();
  const canonicalUrl = alternateLanguageUrls("")[locale];
  const pageUrl = canonicalUrl.replace(/\/$/, "");
  const keywords = t("homeKeywords")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return {
    ...base,
    title: { absolute: t("homeTitle") },
    alternates: {
      ...base.alternates,
      canonical: canonicalUrl,
    },
    keywords,
    openGraph: {
      ...base.openGraph,
      title: t("homeOgTitle"),
      description: t("homeOgDescription"),
      url: pageUrl,
      images: [{ url: `${origin}/og-image.png`, width: 1200, height: 630, alt: "AIscanAuto" }],
    },
    twitter: {
      ...base.twitter,
      card: "summary_large_image",
      title: t("homeTwitterTitle"),
      description: t("homeTwitterDescription"),
      images: [`${origin}/og-image.png`],
    },
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tSeo = await getTranslations({ locale, namespace: "seo" });
  const tLand = await getTranslations({ locale, namespace: "landing" });
  const tNav = await getTranslations({ locale, namespace: "nav" });
  const pageUrl = alternateLanguageUrls("")[locale];
  const pageUrlNoSlash = pageUrl.replace(/\/$/, "");
  const homeLd = await fetchStructuredData({
    bundles: ["home"],
    locale,
    pageUrl,
    title: tSeo("homeTitle"),
    description: tSeo("homeDescription"),
  });

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
