import type { Metadata } from "next";
import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { buildLocalePageMetadata } from "@/lib/seo-metadata";
import DownloadPageContent from "./DownloadPageContent";

type Props = { params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return buildLocalePageMetadata(locale, "/download", "downloadTitle", "downloadDescription");
}

export default async function DownloadPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <Suspense fallback={null}>
      <DownloadPageContent />
    </Suspense>
  );
}
