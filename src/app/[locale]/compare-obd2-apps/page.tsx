import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import CompareObd2AppsContent from "@/components/marketing/CompareObd2AppsContent";
import { buildOpenGraphTwitterBlock, staticOpenGraphImageAbsoluteUrl } from "@/lib/og-metadata";
import { alternateLanguageUrls } from "@/lib/site-url";

/** Канонический путь (без легаси /marketing/). */
const PATH = "/compare-obd2-apps";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const tSeo = await getTranslations({ locale, namespace: "seo" });
  const languages = alternateLanguageUrls(PATH);
  const title = tSeo("compareObd2Title");
  const description = tSeo("compareObd2Description");
  const canonicalUrl = languages[locale];
  const ogTw = buildOpenGraphTwitterBlock({
    locale,
    title,
    description,
    url: canonicalUrl,
    imageUrl: staticOpenGraphImageAbsoluteUrl(locale),
  });
  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages,
    },
    ...ogTw,
  };
}

export default async function CompareObd2AppsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "compareObd2Page" });
  return <CompareObd2AppsContent t={t} />;
}
