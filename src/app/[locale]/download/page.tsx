import { Anchor, Container, Stack, Text, Title } from "@mantine/core";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { buildLocalePageMetadata } from "@/lib/seo-metadata";
import { localizedPath } from "@/lib/site-url";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildLocalePageMetadata(locale, "/download", "downloadTitle", "downloadDescription");
}

export default async function DownloadPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tSeo = await getTranslations({ locale, namespace: "seo" });
  const tDown = await getTranslations({ locale, namespace: "downloadPage" });

  return (
    <Container size="md" py="xl">
      <Stack gap="md">
        <Title order={1}>{tDown("title")}</Title>
        <Text c="dimmed">{tDown("subtitle")}</Text>
        <Text size="sm">{tSeo("downloadDescription")}</Text>
        <Text size="sm">
          {/*
           * Не передавать `component={Link}` из RSC в Mantine Anchor (клиентский компонент) —
           * только plain props. Локализованный URL тот же, что у next-intl Link.
           */}
          <Anchor href={localizedPath(locale, "/marketing/pricing")} size="sm">
            {tDown("ctaUpgrade")}
          </Anchor>
        </Text>
      </Stack>
    </Container>
  );
}
