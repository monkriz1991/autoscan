import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import PlatformObd2LandingContent from "@/components/marketing/PlatformObd2LandingContent";
import { routing } from "@/i18n/routing";
import { buildOpenGraphTwitterBlock, staticOpenGraphImageAbsoluteUrl } from "@/lib/og-metadata";
import { generateLocalizedMetadata } from "@/lib/seo/generate-localized-metadata";

const PATH = "/mac-obd2-scanner";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const tSeo = await getTranslations({ locale, namespace: "seo" });
  const localized = generateLocalizedMetadata(locale, {
    pathWithoutLocale: PATH,
    title: tSeo("macObd2Title"),
    description: tSeo("macObd2Description"),
    extraKeywords: ["Mac OBD2 scanner", "ELM327 macOS"],
    appendKeywordsToDescription: 1,
  });
  const titleStr = localized.title as string;
  const descriptionStr = localized.description as string;
  const canonicalUrl = localized.alternates?.canonical as string;
  const ogTw = buildOpenGraphTwitterBlock({
    locale,
    title: titleStr,
    description: descriptionStr,
    url: canonicalUrl,
    imageUrl: staticOpenGraphImageAbsoluteUrl(locale),
  });
  return {
    title: { absolute: titleStr },
    description: descriptionStr,
    keywords: localized.keywords,
    alternates: localized.alternates,
    ...ogTw,
  };
}

export default async function MacObd2ScannerPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "macObd2Page" });
  return <PlatformObd2LandingContent t={t} />;
}
