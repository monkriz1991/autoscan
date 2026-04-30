import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import PrivacyPolicyContent from "@/components/marketing/PrivacyPolicyContent";
import { buildLocalePageMetadata } from "@/lib/seo-metadata";
import { buildTitle } from "@/lib/seo/titles";
import { getLegalSiteInfo } from "@/lib/legal-site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const absoluteTitle = buildTitle.privacy();
  const base = await buildLocalePageMetadata(
    locale,
    "/privacy",
    "privacyTitle",
    "privacyDescription",
    { pageTitleOverride: absoluteTitle },
  );
  return { ...base, title: { absolute: absoluteTitle } };
}

/** Политика конфиденциальности; реквизиты — через NEXT_PUBLIC_LEGAL_* (см. .env.example). */
export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "privacyPage" });
  const info = getLegalSiteInfo();

  return <PrivacyPolicyContent t={t} info={info} />;
}
