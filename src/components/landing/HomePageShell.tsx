import { Container, Group, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { getTranslations } from "next-intl/server";
import { localizedPath } from "@/lib/site-url";

type Props = { locale: string };

/**
 * SSR-контент главной: один <h1> и основной текст не зависят от client state / auth.
 * Интерактив (карусели, проверка токена) — вынести в отдельные маленькие client-компоненты при необходимости.
 */
export default async function HomePageShell({ locale }: Props) {
  const t = await getTranslations({ locale, namespace: "landing" });
  const tNav = await getTranslations({ locale, namespace: "nav" });
  const h1Text = `${t("hero.headlineFree")} ${t("hero.headlineAi")} ${t("hero.headlineSeconds")}`;

  const brands = [
    t("cars.brands.toyota"),
    t("cars.brands.bmw"),
    t("cars.brands.ford"),
    t("cars.brands.volkswagen"),
    t("cars.brands.honda"),
  ].join(", ");

  return (
    <Stack gap="xl" py={{ base: "md", sm: "xl" }}>
      <Container size="lg">
        <Stack gap="md">
          <Text size="sm" c="dimmed" fw={600}>
            {t("hero.badge")}
          </Text>
          <Title order={1} fz={{ base: "1.75rem", sm: "2.25rem" }} lh={1.2}>
            {h1Text}
          </Title>
          <Text size="lg" c="dimmed" maw={720}>
            {t("hero.subheadline")}
          </Text>
          <Group gap="sm" wrap="wrap">
            <a className="btn-cta-primary" href={localizedPath(locale, "/register")}>
              {t("hero.ctaTryFree")}
            </a>
            <a className="btn-cta-primary" href={localizedPath(locale, "/download")}>
              {t("hero.ctaDownload")}
            </a>
            <a className="btn-cta-primary" href={localizedPath(locale, "/marketing/pricing")}>
              {t("pricing.title")}
            </a>
          </Group>
          <Text size="sm" c="dimmed">
            {t("hero.socialProofCta")}
          </Text>
        </Stack>
      </Container>

      <Container size="lg">
        <Title order={2} fz="h3" mb="md">
          {t("features.sectionTitle")}
        </Title>
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
          <Stack gap="sm">
            <Title order={3} fz="h4">
              {t("features.chatLeadTitle")}
            </Title>
            <Text c="dimmed">{t("features.chatLeadBody")}</Text>
          </Stack>
          <Stack gap="sm">
            <Title order={3} fz="h4">
              {t("features.f4.title")}
            </Title>
            <Text c="dimmed">{t("features.f4.body")}</Text>
          </Stack>
        </SimpleGrid>
      </Container>

      <Container size="lg">
        <Title order={2} fz="h3" mb="xs">
          {t("cars.title")}
        </Title>
        <Text c="dimmed" mb="sm">
          {t("cars.subtitle")}
        </Text>
        <Text size="sm" c="dimmed">
          {brands}. {t("cars.footnote")}
        </Text>
      </Container>

      <Container size="lg">
        <Title order={2} fz="h3" mb="xs">
          {t("pricing.title")}
        </Title>
        <Text c="dimmed" mb="md">
          {t("pricing.subtitle")}
        </Text>
        <a className="btn-cta-primary" href={localizedPath(locale, "/marketing/pricing")}>
          {tNav("pricing")}
        </a>
      </Container>
    </Stack>
  );
}
