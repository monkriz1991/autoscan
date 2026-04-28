import { Container, Stack, Text, Title } from "@mantine/core";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import JsonLd from "@/components/seo/JsonLd";
import { getDtcCodeForLocale } from "@/lib/api";
import { buildOpenGraphTwitterBlock, dtcOpenGraphImageAbsoluteUrl } from "@/lib/og-metadata";
import { generateLocalizedMetadata } from "@/lib/seo/generate-localized-metadata";
import {
  fetchStructuredData,
  mergeStructuredDataDocs,
  withStructuredDataFallback,
} from "@/lib/seo/structured-data";
import { buildStaticGlobalStructuredData } from "@/lib/seo/static-structured-data";
import { alternateLanguageUrls } from "@/lib/site-url";

type PageProps = { params: Promise<{ locale: string; code: string }> };

/** ISR: коды подтягиваются из API по запросу (тысячи кодов без полного SSG). */
export const revalidate = 600;

/**
 * SEO DTC:
 * - canonical + hreflang — middleware + generateCanonicalUrl; код в верхнем регистре.
 * - title/description из БД (meta_*), иначе шаблон из messages.
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, code } = await params;
  const upper = code.toUpperCase();
  const pathWithoutLocale = `/dtc/${upper}`;
  const detail = await getDtcCodeForLocale(locale, upper).catch(() => null);
  const t = await getTranslations({ locale, namespace: "seo" });
  const title =
    detail?.meta_title?.trim() ||
    detail?.summary?.slice(0, 80) ||
    t("dtcTitle", { code: upper });
  const description =
    detail?.meta_description?.trim() || detail?.summary?.slice(0, 160) || t("dtcDescription", { code: upper });

  const localized = generateLocalizedMetadata(locale, {
    pathWithoutLocale,
    title,
    description,
    extraKeywords: [`DTC ${upper}`, "OBD2"],
  });

  const ogTw = buildOpenGraphTwitterBlock({
    locale,
    title: localized.title as string,
    description: localized.description as string,
    url: localized.alternates?.canonical as string,
    imageUrl: dtcOpenGraphImageAbsoluteUrl(locale, upper),
  });

  return {
    ...localized,
    ...ogTw,
  };
}

export default async function DtcCodePage({ params }: PageProps) {
  const { locale, code } = await params;
  setRequestLocale(locale);
  const upper = code.toUpperCase();

  const detail = await getDtcCodeForLocale(locale, upper).catch(() => null);
  if (!detail) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: "dtcPage" });
  const tDetail = await getTranslations({ locale, namespace: "dtcDetail" });
  const pathWithoutLocale = `/dtc/${upper}`;
  const pageUrl = alternateLanguageUrls(pathWithoutLocale)[locale];
  const tSeo = await getTranslations({ locale, namespace: "seo" });
  const titleForLd =
    detail.meta_title?.trim() ||
    detail.summary?.slice(0, 80) ||
    tSeo("dtcTitle", { code: upper });
  const descForLd =
    detail.meta_description?.trim() || detail.summary?.slice(0, 160) || tSeo("dtcDescription", { code: upper });

  const remoteRaw = await fetchStructuredData({
    bundles: ["dtc_code"],
    locale,
    pageUrl,
    slug: upper,
    title: titleForLd,
    description: descForLd,
  });
  const pageLd = withStructuredDataFallback(remoteRaw, { "@context": "https://schema.org", "@graph": [] });
  const merged = mergeStructuredDataDocs(buildStaticGlobalStructuredData(), pageLd);

  return (
    <>
      <JsonLd data={merged} />
      <Container size="md" py="xl">
        <Stack gap="lg">
          <div>
            <Text size="sm" c="dimmed" tt="uppercase" fw={700}>
              DTC · {detail.family}
            </Text>
            <Title order={1}>{upper}</Title>
            <Text c="dimmed" mt="xs">
              {t("detailIntro")}
            </Text>
          </div>

          {detail.summary ? (
            <section>
              <Title order={2} size="h4">
                {t("summaryLabel")}
              </Title>
              <Text mt="sm" style={{ whiteSpace: "pre-wrap", lineHeight: 1.65 }}>
                {detail.summary}
              </Text>
            </section>
          ) : null}

          <section>
            <Title order={2} size="h4">
              {tDetail("sourceEn")}
            </Title>
            <Text mt="sm" style={{ whiteSpace: "pre-wrap", lineHeight: 1.65 }}>
              {detail.source_description}
            </Text>
          </section>

          {detail.articles.length > 0 ? (
            <section style={{ display: "grid", gap: "1.25rem" }}>
              <Title order={2} size="h4">
                {t("articlesBadge")}
              </Title>
              {detail.articles.map((art) => (
                <article
                  key={art.slug}
                  style={{
                    padding: "1rem",
                    borderRadius: "0.75rem",
                    border: "1px solid rgba(148, 163, 184, 0.35)",
                  }}
                >
                  <Title order={3} size="h5">
                    {art.title}
                  </Title>
                  {art.excerpt ? (
                    <Text size="sm" c="dimmed" mt={4}>
                      {art.excerpt}
                    </Text>
                  ) : null}
                  {art.body_html ? (
                    <div
                      className="blog-prose"
                      style={{ marginTop: "0.75rem" }}
                      dangerouslySetInnerHTML={{ __html: art.body_html }}
                    />
                  ) : null}
                </article>
              ))}
            </section>
          ) : null}
        </Stack>
      </Container>
    </>
  );
}
