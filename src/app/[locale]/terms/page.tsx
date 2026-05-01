import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import TermsOfServiceMarkdownBody from "@/components/marketing/TermsOfServiceMarkdownBody";
import { buildLocalePageMetadata } from "@/lib/seo-metadata";
import { buildTitle } from "@/lib/seo/titles";
import { loadTermsMarkdown } from "@/lib/legal-markdown";

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
  const t = await getTranslations({ locale, namespace: "termsOfService" });
  const markdown = loadTermsMarkdown(locale);
  const showEnglishNotice = locale !== "en" && locale !== "ru";
  const notice = showEnglishNotice ? t("englishBindingNotice") : "";

  return <TermsOfServiceMarkdownBody notice={notice} markdown={markdown} />;
}
