import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { getDownloadsPageForLocale } from "@/lib/api";
import { detectClientOsFromUserAgent } from "@/lib/detectClientOs";
import { alternateLanguageUrls } from "@/lib/site-url";
import DownloadPageClient from "./DownloadPageClient";

const PATH = "/download";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });
  return {
    title: t("downloadTitle"),
    description: t("downloadDescription"),
    alternates: { languages: alternateLanguageUrls(PATH) },
  };
}

export default async function DownloadPage({ params }: Props) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }
  setRequestLocale(locale);

  const h = await headers();
  const ua = h.get("user-agent");
  const cookie = h.get("cookie");
  const detected = detectClientOsFromUserAgent(ua);

  let initialData = null;
  let loadFailed = false;
  try {
    initialData = await getDownloadsPageForLocale(detected, locale, {
      cookieHeader: cookie,
    });
  } catch {
    loadFailed = true;
  }

  return <DownloadPageClient initialData={initialData} loadFailed={loadFailed} />;
}
