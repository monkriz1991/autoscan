import { Container, Stack, Text, Title } from "@mantine/core";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import JsonLd from "@/components/seo/JsonLd";
import dtcCodeKeys from "@/data/dtc-code-keys.json";
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
import { buildTitle } from "@/lib/seo/titles";
import { stripHeadOnlyTagsFromHtml } from "@/lib/sanitize-rich-html";

type PageProps = { params: Promise<{ locale: string; code: string }> };

/** Предгенерация топ-N кодов из того же списка, что и sitemap-fallback (холодный SSR реже). */
const DTC_PREBUILD_STATIC_COUNT = 500;

function topDtcCodesForStaticParams(): string[] {
  const arr = dtcCodeKeys as unknown;
  if (!Array.isArray(arr)) return [];
  return arr
    .filter((c): c is string => typeof c === "string" && /^[PBCU][0-9A-Fa-f]{4}$/i.test(c))
    .slice(0, DTC_PREBUILD_STATIC_COUNT)
    .map((c) => c.toUpperCase());
}

export function generateStaticParams() {
  const codes = topDtcCodesForStaticParams();
  const out: { locale: string; code: string }[] = [];
  for (const locale of routing.locales) {
    for (const code of codes) {
      out.push({ locale, code });
    }
  }
  return out;
}

/** ISR: остальные коды подтягиваются из API по запросу. */
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
  const summarySnippet = (detail?.summary?.trim() ?? "").slice(0, 120);
  const metaForTitle = (detail?.meta_title?.trim() ?? "") || summarySnippet;
  const title = detail
    ? buildTitle.dtcCode(upper, metaForTitle || t("dtcDescription", { code: upper }).slice(0, 120))
    : t("dtcTitle", { code: upper });
  const description =
    detail?.meta_description?.trim() || detail?.summary?.slice(0, 160) || t("dtcDescription", { code: upper });

  const p0420Commercial: string[] =
    upper === "P0420" ? ["P0420 catalyst repair cost", "catalyst efficiency below threshold"] : [];
  const localized = generateLocalizedMetadata(locale, {
    pathWithoutLocale,
    title,
    description,
    extraKeywords: [`DTC ${upper}`, "OBD2", ...p0420Commercial],
  });
  const languages = alternateLanguageUrls(pathWithoutLocale);
  const canonicalUrl = languages.en ?? (localized.alternates?.canonical as string);

  const ogTw = buildOpenGraphTwitterBlock({
    locale,
    title,
    description: localized.description as string,
    url: canonicalUrl,
    imageUrl: dtcOpenGraphImageAbsoluteUrl(locale, upper),
  });

  return {
    ...localized,
    title: { absolute: title },
    alternates: {
      ...localized.alternates,
      canonical: canonicalUrl,
      languages,
    },
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
                      dangerouslySetInnerHTML={{ __html: stripHeadOnlyTagsFromHtml(art.body_html) }}
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
