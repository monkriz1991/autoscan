import { Badge, Group, Image, Stack, Text } from "@mantine/core";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import JsonLd from "@/components/seo/JsonLd";
import { routing } from "@/i18n/routing";
import { buildFaqStructuredDataFromPublicItems } from "@/lib/seo/faq-public-structured";
import { mergeStructuredDataDocs } from "@/lib/seo/structured-data";
import { buildStaticGlobalStructuredData } from "@/lib/seo/static-structured-data";
import { buildLocalePageMetadata } from "@/lib/seo-metadata";
import { getPublicFaqForLocale } from "@/lib/api";
import { generateCanonicalUrlForLocale } from "@/lib/site-url";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildLocalePageMetadata(locale, "/faq", "faqTitle", "faqDescription");
}

export default async function FaqPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tSeo = await getTranslations({ locale, namespace: "seo" });
  const t = await getTranslations({ locale, namespace: "faqPage" });
  const pageUrl = generateCanonicalUrlForLocale(locale, "/faq");
  const items = await getPublicFaqForLocale(locale).catch((err) => {
    console.error("[FaqPage] failed to load FAQ", err);
    return null;
  });
  const listForSchema = items ?? [];
  const faqPart = buildFaqStructuredDataFromPublicItems(listForSchema, pageUrl);
  const faqJsonLd = mergeStructuredDataDocs(buildStaticGlobalStructuredData(), faqPart);

  return (
    <Stack component="section" gap="lg" className="faq-page marketing-page">
      <JsonLd data={faqJsonLd} />
      <div className="marketing-page__hero">
        <h1 className="marketing-page__hero-title">{t("title")}</h1>
        <p className="marketing-page__hero-sub">{tSeo("faqDescription")}</p>
      </div>

      {items === null ? (
        <Text c="red">{t("error")}</Text>
      ) : items.length === 0 ? (
        <Text c="dimmed">{t("empty")}</Text>
      ) : (
        <div role="list" className="landing-faq__list">
          {items.map((item) => (
            <details key={item.slug} className="landing-faq__item" role="listitem">
              <summary className="landing-faq__trigger">
                <Group gap="md" wrap="nowrap" align="center" style={{ flex: 1 }}>
                  {item.cover_image_url ? (
                    <Image
                      src={item.cover_image_url}
                      alt=""
                      w={56}
                      h={56}
                      radius="md"
                      fit="cover"
                      aria-hidden
                    />
                  ) : null}
                  <span>
                    <Text fw={700} className="landing-faq__question">
                      {item.question}
                    </Text>
                    {item.excerpt ? (
                      <Text size="sm" c="dimmed" mt={4}>
                        {item.excerpt}
                      </Text>
                    ) : null}
                  </span>
                </Group>
              </summary>
              <div className="landing-faq__panel-inner">
                <div
                  className="faq-answer ck-content"
                  dangerouslySetInnerHTML={{ __html: item.answer_html }}
                />
                {item.available_locales.length > 0 ? (
                  <Group gap="xs" mt="md">
                    <Text size="xs" c="dimmed">
                      {t("translations")}:
                    </Text>
                    {item.available_locales.map((loc) => (
                      <Badge key={loc} variant="light" color="gray" size="xs">
                        {loc.toUpperCase()}
                      </Badge>
                    ))}
                  </Group>
                ) : null}
              </div>
            </details>
          ))}
        </div>
      )}
    </Stack>
  );
}
