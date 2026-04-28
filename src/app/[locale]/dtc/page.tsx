import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import JsonLd from "@/components/seo/JsonLd";
import { buildOpenGraphTwitterBlock, staticOpenGraphImageAbsoluteUrl } from "@/lib/og-metadata";
import { generateLocalizedMetadata } from "@/lib/seo/generate-localized-metadata";
import {
  fetchStructuredData,
  mergeStructuredDataDocs,
  withStructuredDataFallback,
} from "@/lib/seo/structured-data";
import { buildStaticGlobalStructuredData } from "@/lib/seo/static-structured-data";
import {
  alternateLanguageUrls,
  generateCanonicalUrl,
  generateCanonicalUrlForLocale,
  localizedPath,
} from "@/lib/site-url";
import { routing } from "@/i18n/routing";
import DtcIndexContent from "./DtcIndexContent";

function firstString(v: string | string[] | undefined): string | undefined {
  if (typeof v === "string" && v.length) return v;
  if (Array.isArray(v) && v[0]) return v[0];
  return undefined;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    q?: string | string[];
    family?: string | string[];
    has_articles?: string | string[];
    page?: string | string[];
  }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const sp = await searchParams;
  const q = firstString(sp.q);
  const family = firstString(sp.family);
  const hasA = firstString(sp.has_articles);
  const pageNum = firstString(sp.page);
  const filterNoise = Boolean(q || family || hasA);

  const t = await getTranslations({ locale, namespace: "seo" });
  const localized = generateLocalizedMetadata(locale, {
    pathWithoutLocale: "/dtc",
    title: t("dtcIndexTitle"),
    description: t("dtcIndexDescription"),
    extraKeywords: ["DTC", "OBD2"],
  });

  let canonical = localized.alternates?.canonical as string;
  if (pageNum && !filterNoise) {
    const qs = new URLSearchParams({ page: pageNum });
    canonical = generateCanonicalUrl(`${localizedPath(locale, "/dtc")}?${qs}`);
  }
  if (filterNoise) {
    canonical = generateCanonicalUrlForLocale(locale, "/dtc");
  }

  const langs = alternateLanguageUrls("/dtc");
  const languages = filterNoise
    ? Object.fromEntries(routing.locales.map((loc) => [loc, langs[loc]]))
    : localized.alternates?.languages;

  const ogTw = buildOpenGraphTwitterBlock({
    locale,
    title: localized.title as string,
    description: localized.description as string,
    url: canonical,
    imageUrl: staticOpenGraphImageAbsoluteUrl(locale),
  });

  return {
    ...localized,
    alternates: {
      ...localized.alternates,
      canonical,
      languages,
    },
    ...ogTw,
    ...(filterNoise
      ? { robots: { index: false, follow: true, googleBot: { index: false, follow: true } } }
      : {}),
  };
}

export default async function DtcIndexPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    q?: string | string[];
    family?: string | string[];
    has_articles?: string | string[];
    page?: string | string[];
  }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const tSeo = await getTranslations({ locale, namespace: "seo" });
  const t = await getTranslations({ locale, namespace: "dtcPage" });
  const pageUrl = alternateLanguageUrls("/dtc")[locale];
  const title = tSeo("dtcIndexTitle");
  const description = tSeo("dtcIndexDescription");

  const remoteRaw = await fetchStructuredData({
    bundles: ["dtc_list"],
    locale,
    pageUrl,
    title,
    description,
  });
  const pageLd = withStructuredDataFallback(remoteRaw, {
    "@context": "https://schema.org",
    "@graph": [],
  });
  const merged = mergeStructuredDataDocs(buildStaticGlobalStructuredData(), pageLd);

  return (
    <>
      <JsonLd data={merged} />
      <section className="marketing-page marketing-page--wide">
        <div className="marketing-page__hero">
          <h1 className="marketing-page__hero-title">{t("title")}</h1>
          <p className="marketing-page__hero-sub">{t("subtitle")}</p>
        </div>

        <Suspense fallback={<p style={{ padding: "1rem 1.5rem", color: "#64748b" }}>{t("loading")}</p>}>
          <DtcIndexContent locale={locale} searchParams={sp} />
        </Suspense>
      </section>
    </>
  );
}
