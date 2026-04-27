import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import CompareObd2AppsContent from "@/components/marketing/CompareObd2AppsContent";
import { alternateLanguageUrls } from "@/lib/site-url";

const PATH = "/marketing/compare-obd2-apps";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const tSeo = await getTranslations({ locale, namespace: "seo" });
  const languages = alternateLanguageUrls(PATH);
  return {
    title: tSeo("compareObd2Title"),
    description: tSeo("compareObd2Description"),
    alternates: {
      canonical: languages[locale],
      languages,
    },
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
