"use client";

import { Card, Divider, Group, Stack, Text, Title } from "@mantine/core";
import { useTranslations } from "next-intl";
import type { UpgradePreview } from "@/lib/api";

type Props = {
  preview: UpgradePreview;
  targetPlanName?: string;
};

/**
 * Разбивка расчёта доплаты при апгрейде (Mantine).
 */
export function UpgradePreviewCard({ preview, targetPlanName }: Props) {
  const t = useTranslations("checkout");

  return (
    <Card withBorder shadow="sm" radius="md" p="lg" bg="var(--mantine-color-teal-0)">
      <Title order={5} mb="sm">
        {t("upgradeTitle")}
      </Title>
      {targetPlanName ? (
        <Text size="sm" c="dimmed" mb="xs">
          {t("upgradeTargetPlan", { plan: targetPlanName })}
        </Text>
      ) : null}
      <Stack gap="xs">
        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            {t("upgradeFullNewPrice")}
          </Text>
          <Text size="sm" fw={500}>
            {preview.p_new} {preview.currency}
          </Text>
        </Group>
        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            {t("upgradeCreditTime", { days: preview.d_remaining, total: preview.d_total })}
          </Text>
          <Text size="sm">
            −{preview.credit_time} {preview.currency}
          </Text>
        </Group>
        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            {t("upgradeCreditRequests", {
              used: preview.requests_used,
              limit: preview.request_limit,
            })}
          </Text>
          <Text size="sm">
            −{preview.credit_requests} {preview.currency}
          </Text>
        </Group>
        <Divider />
        <Group justify="space-between">
          <Text size="sm" fw={600}>
            {t("upgradeCreditApplied")}
          </Text>
          <Text size="sm" fw={600}>
            {preview.credit_applied} {preview.currency}
          </Text>
        </Group>
        <Group justify="space-between">
          <Text fw={700}>{t("upgradeAmountDue")}</Text>
          <Text fw={700} c="teal.8">
            {preview.upgrade_amount} {preview.currency}
          </Text>
        </Group>
      </Stack>
      <Text size="xs" c="dimmed" mt="md">
        {t("upgradeFootnote")}
      </Text>
    </Card>
  );
}
