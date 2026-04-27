import { Container, Stack, Text, Title } from "@mantine/core";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { buildOpenGraphTwitterBlock, dtcOpenGraphImageAbsoluteUrl } from "@/lib/og-metadata";
import { generateLocalizedMetadata } from "@/lib/seo/generate-localized-metadata";

type PageProps = { params: Promise<{ locale: string; code: string }> };

/** Пример кодов для SSG; замените выборкой из БД. */
const EXAMPLE_DTC_CODES = ["P0420"] as const;

export function generateStaticParams() {
  const out: { locale: string; code: string }[] = [];
  for (const locale of routing.locales) {
    for (const code of EXAMPLE_DTC_CODES) {
      out.push({ locale, code });
    }
  }
  return out;
}

/**
 * SEO DTC:
 * - canonical + hreflang: один и тот же код (напр. P0420) на всех локалях; канонический регистр — middleware + generateCanonicalUrl*.
 * - Контент: лучше ручные переводы (как title/description в messages) или редакторский контент из БД. Машинный перевод допустим
 *   как черновик, но для YMYL/техники лучше вычитка носителем — иначе риск «тонкого» дубля при почти одинаковом EN+MT.
 * - Дубли: не дублировать один язык на двух URL; en без /en; x-default = en-версия (см. getAlternateLanguages / alternateLanguageUrls).
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, code } = await params;
  const upper = code.toUpperCase();
  const pathWithoutLocale = `/dtc/${upper}`;
  const t = await getTranslations({ locale, namespace: "seo" });
  const localized = generateLocalizedMetadata(locale, {
    pathWithoutLocale,
    title: t("dtcTitle", { code: upper }),
    description: t("dtcDescription", { code: upper }),
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

  return (
    <Container size="md" py="xl">
      <Stack gap="md">
        <Title order={1}>DTC {upper}</Title>
        <Text c="dimmed">
          Шаблон страницы кода ошибки OBD2. Подключите контент из БД и расширьте generateStaticParams.
        </Text>
      </Stack>
    </Container>
  );
}
