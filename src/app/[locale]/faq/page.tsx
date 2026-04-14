import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Stack, Title } from "@mantine/core";
import FaqSection from "@/components/landing/FaqSection";
import StaticJsonLd from "@/components/landing/StaticJsonLd";
import JsonLd from "@/components/seo/JsonLd";
import { fetchStructuredData } from "@/lib/seo/structured-data";
import { alternateLanguageUrls } from "@/lib/site-url";

const PATH = "/faq";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });
  return {
    title: t("faqTitle"),
    description: t("faqDescription"),
    alternates: { languages: alternateLanguageUrls(PATH) },
  };
}

export default async function FaqPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tSeo = await getTranslations({ locale, namespace: "seo" });
  const tNav = await getTranslations({ locale, namespace: "nav" });
  const t = await getTranslations({ locale, namespace: "landing.faq" });
  const pageUrl = alternateLanguageUrls(PATH)[locale];
  const faqLd = await fetchStructuredData({
    bundles: ["faq", "webpage"],
    locale,
    pageUrl,
    title: tSeo("faqTitle"),
    description: tSeo("faqDescription"),
  });
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: tNav("home"), item: alternateLanguageUrls("")[locale] },
      { "@type": "ListItem", position: 2, name: t("title"), item: pageUrl },
    ],
  };
  return (
    <>
      <JsonLd data={faqLd} />
      <StaticJsonLd data={breadcrumbLd} />
      <Stack component="main" className="container faq-page marketing-page" gap="lg" py="xl" pb={72}>
        <Title order={1} className="landing-section-title">
          {t("title")}
        </Title>
        <FaqSection />
      </Stack>
    </>
  );
}
