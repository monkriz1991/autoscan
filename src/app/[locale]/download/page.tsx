import type { Metadata } from "next";
import { headers } from "next/headers";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { buildLocalePageMetadata } from "@/lib/seo-metadata";
import { getDownloadsPageForLocale } from "@/lib/api";
import { detectClientOsFromUserAgent } from "@/lib/detectClientOs";
import DownloadPageClient from "./DownloadPageClient";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildLocalePageMetadata(locale, "/download", "downloadTitle", "downloadDescription");
}

export default async function DownloadPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const requestHeaders = await headers();
  const clientOs = detectClientOsFromUserAgent(requestHeaders.get("user-agent"));
  const cookieHeader = requestHeaders.get("cookie");

  const initialData = await getDownloadsPageForLocale(clientOs, locale, { cookieHeader }).catch(
    (err) => {
      console.error("[DownloadPage] failed to load downloads", err);
      return null;
    },
  );

  return <DownloadPageClient initialData={initialData} loadFailed={!initialData} />;
}
