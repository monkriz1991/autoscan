import type { Metadata } from "next";
import { Container, Stack, Text, Title } from "@mantine/core";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getLocaleFromRequestPathname } from "@/lib/request-locale";
import { localizedPath } from "@/lib/site-url";

/** Не индексировать страницу ошибки в поиске. */
export const metadata: Metadata = {
  title: "404",
  robots: { index: false, follow: true },
};

/**
 * Локализованная 404 внутри `[locale]` (неверная локаль, несуществующий путь).
 * HTTP 404 выставляет Next при вызове notFound() или отсутствии сегмента маршрута.
 */
export default async function LocaleNotFound() {
  const locale = await getLocaleFromRequestPathname();
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "notFound" });

  return (
    <Container size="sm" py="xl">
      <Stack gap="md">
        <Title order={1}>{t("title")}</Title>
        <Text c="dimmed">{t("description")}</Text>
        <Text>
          <a className="btn-cta-primary" href={localizedPath(locale, "/")}>
            {t("backHome")}
          </a>
        </Text>
      </Stack>
    </Container>
  );
}
