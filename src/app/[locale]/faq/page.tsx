import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Stack, Title } from "@mantine/core";
import FaqSection from "@/components/landing/FaqSection";
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
  const t = await getTranslations({ locale, namespace: "landing.faq" });
  return (
    <Stack component="main" className="container faq-page marketing-page" gap="lg" py="xl" pb={72}>
      <Title order={1} className="landing-section-title">
        {t("title")}
      </Title>
      <FaqSection />
    </Stack>
  );
}
