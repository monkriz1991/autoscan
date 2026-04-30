import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import TermsOfServiceContent from "@/components/marketing/TermsOfServiceContent";
import { buildLocalePageMetadata } from "@/lib/seo-metadata";
import { buildTitle } from "@/lib/seo/titles";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const absoluteTitle = buildTitle.terms();
  const base = await buildLocalePageMetadata(locale, "/terms", "termsTitle", "termsDescription", {
    pageTitleOverride: absoluteTitle,
  });
  return { ...base, title: { absolute: absoluteTitle } };
}

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <TermsOfServiceContent />;
}
