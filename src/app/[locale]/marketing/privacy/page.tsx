import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import PrivacyPolicyContent from "@/components/marketing/PrivacyPolicyContent";
import { getLegalSiteInfo } from "@/lib/legal-site";
import { alternateLanguageUrls } from "@/lib/site-url";

/** Полная политика конфиденциальности AutoScan; реквизиты оператора — через NEXT_PUBLIC_LEGAL_* (см. .env.example). */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const tSeo = await getTranslations({ locale, namespace: "seo" });
  const path = "/marketing/privacy";
  return {
    title: tSeo("privacyTitle"),
    description: tSeo("privacyDescription"),
    alternates: { languages: alternateLanguageUrls(path) },
  };
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "privacyPage" });
  const info = getLegalSiteInfo();

  return <PrivacyPolicyContent t={t} info={info} />;
}
