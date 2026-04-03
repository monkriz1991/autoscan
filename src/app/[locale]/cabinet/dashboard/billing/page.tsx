"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  Badge,
  Button,
  Card,
  Center,
  Group,
  Loader,
  ScrollArea,
  Stack,
  Table,
  Text,
  Title,
} from "@mantine/core";
import { BillingOnDemandCard } from "@/components/cabinet/billing/BillingOnDemandCard";
import {
  getBillingSummary,
  getOnDemandSettings,
  getUsageStatus,
  type BillingSummary,
  type OnDemandSettings,
} from "@/lib/api";

function formatDate(iso: string | null | undefined, locale: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function paymentStatusColor(s: string): string {
  if (s === "completed") return "green";
  if (s === "pending") return "yellow";
  if (s === "expired" || s === "cancelled" || s === "mismatch") return "red";
  return "gray";
}

function keyStatusColor(s: string): string {
  if (s === "active") return "green";
  if (s === "expired") return "gray";
  if (s === "revoked") return "red";
  return "dimmed";
}

export default function CabinetBillingPage() {
  const t = useTranslations("billingPage");
  const locale = useLocale();
  const [data, setData] = useState<BillingSummary | null>(null);
  const [onDemand, setOnDemand] = useState<OnDemandSettings | null>(null);
  const [usageOnDemandUsd, setUsageOnDemandUsd] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      getBillingSummary().catch(() => null),
      getOnDemandSettings().catch(() => null),
      getUsageStatus().catch(() => null),
    ])
      .then(([b, o, u]) => {
        setData(b);
        setOnDemand(o);
        setUsageOnDemandUsd(u?.on_demand_used_usd ?? null);
        if (!b) setError(t("loadError"));
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Center py="xl">
        <Loader size="lg" />
      </Center>
    );
  }

  if (!data) {
    return (
      <Text c="red" size="sm">
        {error || t("loadError")}
      </Text>
    );
  }

  const cp = data.current_plan;
  const labelPlan =
    data.license.plan_label ?? data.license.plan ?? cp.plan_name;

  return (
    <Stack gap="xl">
      <Title order={1}>{t("title")}</Title>

      <Card withBorder p="lg" radius="md" shadow="sm">
        <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb="sm">
          {t("currentPlan")}
        </Text>
        <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
          <div>
            <Title order={3} mb="xs">
              {labelPlan}
            </Title>
            <Group gap="xs" mb="xs">
              <Badge variant="light" color={cp.is_active ? "green" : "gray"}>
                {data.license.status_label ?? cp.status}
              </Badge>
              {cp.tier && (
                <Badge variant="outline" color="gray">
                  {cp.tier}
                </Badge>
              )}
            </Group>
            {cp.started_at && (
              <Text size="sm" c="dimmed">
                {t("started")}: {formatDate(cp.started_at, locale)}
              </Text>
            )}
            {(cp.renews_at || cp.expires_at) && (
              <Text size="sm" c="dimmed">
                {cp.is_active ? t("renewsOrExpires") : t("expiredOn")}:{" "}
                {formatDate(cp.renews_at ?? cp.expires_at, locale)}
              </Text>
            )}
            <Text size="sm" mt="xs">
              {cp.price} {cp.currency}
            </Text>
          </div>
          <Group gap="sm">
            {data.actions.show_upgrade && (
              <Button
                component={Link}
                href="/marketing/pricing"
                variant="light"
                size="sm"
                className="btn-metallic btn-metallic-outline"
                color="silver"
              >
                {t("upgrade")}
              </Button>
            )}
            {data.actions.show_renew && (
              <Button
                component={Link}
                href="/marketing/pricing"
                variant="filled"
                size="sm"
              >
                {t("renew")}
              </Button>
            )}
          </Group>
        </Group>
      </Card>

      <Card withBorder p="lg" radius="md" shadow="sm">
        <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb="md">
          {t("entitlementsTitle")}
        </Text>
        <Stack gap="xs">
          <Text size="sm">
            {t("requestsPerMonth", {
              n: data.entitlements.requests_per_month,
            })}
          </Text>
          <Text size="sm">
            {t("devicesLine", {
              used: data.entitlements.devices_in_use,
              max: data.entitlements.devices_max,
            })}
          </Text>
          <Text size="sm">
            {t("sessionsLine", {
              used: data.entitlements.sessions_in_use,
              max: data.entitlements.sessions_max,
            })}
          </Text>
        </Stack>
      </Card>

      <Card withBorder p="lg" radius="md" shadow="sm">
        <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb="md">
          {t("paymentsTitle")}
        </Text>
        {data.payments.length === 0 ? (
          <Text size="sm" c="dimmed">
            {t("noPayments")}
          </Text>
        ) : (
          <ScrollArea type="scroll" offsetScrollbars>
            <Table striped highlightOnHover verticalSpacing="sm" miw={520}>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t("colDate")}</Table.Th>
                  <Table.Th>{t("colAmount")}</Table.Th>
                  <Table.Th>{t("colProvider")}</Table.Th>
                  <Table.Th>{t("colStatus")}</Table.Th>
                  <Table.Th>{t("colInvoice")}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {data.payments.map((p) => (
                  <Table.Tr key={p.id}>
                    <Table.Td>
                      {formatDate(p.paid_at ?? p.created_at, locale)}
                    </Table.Td>
                    <Table.Td>
                      {p.amount} {p.currency}
                    </Table.Td>
                    <Table.Td>{p.provider}</Table.Td>
                    <Table.Td>
                      <Badge size="sm" color={paymentStatusColor(p.status)}>
                        {p.status}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      {p.invoice_url ? (
                        <Button
                          component="a"
                          href={p.invoice_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          size="compact-xs"
                          variant="subtle"
                        >
                          {t("viewInvoice")}
                        </Button>
                      ) : (
                        "—"
                      )}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        )}
      </Card>

      <Card withBorder p="lg" radius="md" shadow="sm">
        <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb="md">
          {t("subscriptionsTitle")}
        </Text>
        {data.subscriptions.length === 0 ? (
          <Text size="sm" c="dimmed">
            {t("noSubscriptions")}
          </Text>
        ) : (
          <Stack gap="sm">
            {data.subscriptions.map((s) => (
              <Card
                key={s.id}
                withBorder
                p="sm"
                radius="sm"
                bg={s.is_active_now ? "var(--mantine-color-green-light)" : undefined}
              >
                <Group justify="space-between">
                  <Text fw={500}>{s.plan_name}</Text>
                  <Badge color={s.is_active_now ? "green" : "gray"}>
                    {s.status}
                  </Badge>
                </Group>
                <Text size="sm" c="dimmed">
                  {formatDate(s.started_at, locale)} →{" "}
                  {formatDate(s.valid_until, locale)}
                </Text>
              </Card>
            ))}
          </Stack>
        )}
      </Card>

      <Card withBorder p="lg" radius="md" shadow="sm">
        <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb="md">
          {t("keysTitle")}
        </Text>
        {data.activation_keys.length === 0 ? (
          <Text size="sm" c="dimmed">
            {t("noKeys")}
          </Text>
        ) : (
          <Stack gap="sm">
            {data.activation_keys.map((k) => (
              <Card key={k.id} withBorder p="sm" radius="sm">
                <Group justify="space-between">
                  <Text size="sm" ff="monospace">
                    {k.masked_key}
                  </Text>
                  <Badge color={keyStatusColor(k.status)}>{k.status}</Badge>
                </Group>
                <Text size="sm">{k.plan_name}</Text>
                <Text size="xs" c="dimmed">
                  {t("keyActivated")}: {formatDate(k.issued_at, locale)}
                  {k.valid_until &&
                    ` · ${t("validUntil")}: ${formatDate(k.valid_until, locale)}`}
                </Text>
              </Card>
            ))}
          </Stack>
        )}
      </Card>

      <BillingOnDemandCard
        initial={onDemand}
        onDemandUsedUsd={usageOnDemandUsd}
      />
    </Stack>
  );
}
