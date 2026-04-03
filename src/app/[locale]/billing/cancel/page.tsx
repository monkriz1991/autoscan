"use client";

import { useTranslations } from "next-intl";
import { Button, Container, Stack, Text, Title } from "@mantine/core";
import { Link } from "@/i18n/navigation";

export default function BillingCancelPage() {
  const t = useTranslations("billing");

  return (
    <Container size="sm" py="xl">
      <Stack gap="md">
        <Title order={2}>{t("cancelTitle")}</Title>
        <Text c="dimmed">{t("cancelBody")}</Text>
        <Button component={Link} href="/pricing" variant="filled" className="btn-metallic">
          {t("backToPricing")}
        </Button>
      </Stack>
    </Container>
  );
}
