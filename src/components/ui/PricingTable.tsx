"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import {
  Badge,
  Button,
  Group,
  ScrollArea,
  Stack,
  Table,
  Text,
  ThemeIcon,
} from "@mantine/core";
import { IconCheck, IconMinus } from "@tabler/icons-react";
import type { Plan, PlanFeatures } from "@/lib/api";
import { isAuthenticated } from "@/lib/api";

type BoolFlagKey = keyof PlanFeatures;

type FeatureRowDef =
  | { kind: "bool"; flag: BoolFlagKey; labelKey: string }
  | { kind: "requests"; labelKey: string };

const FEATURE_ROWS: FeatureRowDef[] = [
  { kind: "bool", flag: "unlimited_devices", labelKey: "feature_unlimited_devices" },
  { kind: "bool", flag: "scan_errors", labelKey: "feature_scan_errors" },
  { kind: "bool", flag: "view_params", labelKey: "feature_view_params" },
  { kind: "bool", flag: "vehicle_config", labelKey: "feature_vehicle_config" },
  { kind: "requests", labelKey: "feature_ai_requests" },
  { kind: "bool", flag: "ai_chat_history", labelKey: "feature_ai_chat_history" },
  { kind: "bool", flag: "record_params", labelKey: "feature_record_params" },
  { kind: "bool", flag: "metrics_history", labelKey: "feature_metrics_history" },
  { kind: "bool", flag: "realtime_analysis", labelKey: "feature_realtime_analysis" },
];

const defaultFeatures: PlanFeatures = {
  unlimited_devices: false,
  scan_errors: false,
  view_params: false,
  vehicle_config: false,
  ai_chat_history: false,
  record_params: false,
  metrics_history: false,
  realtime_analysis: false,
};

function planFeatures(plan: Plan): PlanFeatures {
  return plan.features ?? defaultFeatures;
}

export type PricingTableProps = {
  plans: Plan[];
};

export function PricingTable({ plans }: PricingTableProps) {
  const t = useTranslations("pricing");
  const tNav = useTranslations("nav");

  function formatDuration(days: number | null): string {
    if (days === null) return t("unlimited");
    if (days === 30) return t("month");
    if (days === 365) return t("year");
    return t("days", { count: days });
  }

  function BoolCell({ value }: { value: boolean }) {
    if (value) {
      return (
        <ThemeIcon size={28} radius="md" variant="light" color="teal" aria-label="yes">
          <IconCheck size={16} stroke={2.5} />
        </ThemeIcon>
      );
    }
    return (
      <ThemeIcon size={28} radius="md" variant="light" color="gray" aria-label="no">
        <IconMinus size={16} />
      </ThemeIcon>
    );
  }

  return (
    <ScrollArea type="scroll" offsetScrollbars>
      <Table
        stickyHeader
        horizontalSpacing="md"
        verticalSpacing="sm"
        striped
        highlightOnHover
        miw={640}
      >
        <Table.Thead>
          <Table.Tr>
            <Table.Th style={{ minWidth: 200, left: 0, zIndex: 2 }} />
            {plans.map((plan) => {
              const tier = plan.tier.toLowerCase();
              const isPopular = tier === "pro";
              return (
                <Table.Th key={plan.id} style={{ verticalAlign: "top", minWidth: 160 }}>
                  <Stack gap="xs" align="flex-start">
                    <Badge
                      size="lg"
                      variant={isPopular ? "filled" : "light"}
                      color={isPopular ? "teal" : "blue"}
                      tt="capitalize"
                    >
                      {plan.tier}
                    </Badge>
                    <Text fw={700} size="lg">
                      {plan.name}
                    </Text>
                    <Group gap={4} align="baseline" wrap="nowrap">
                      <Text size="xl" fw={700}>
                        {plan.price}
                      </Text>
                      <Text size="sm" c="dimmed">
                        {plan.currency}
                      </Text>
                    </Group>
                    <Text size="xs" c="dimmed">
                      {formatDuration(plan.duration_days)}
                    </Text>
                  </Stack>
                </Table.Th>
              );
            })}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {FEATURE_ROWS.map((row) => (
            <Table.Tr key={row.labelKey}>
              <Table.Td
                style={{
                  fontWeight: 500,
                  whiteSpace: "normal",
                  maxWidth: 280,
                  background: "var(--mantine-color-body)",
                }}
              >
                {row.kind === "requests" ? (
                  <Text size="sm">{t(row.labelKey as "feature_ai_requests")}</Text>
                ) : (
                  <Text size="sm">{t(row.labelKey as "feature_unlimited_devices")}</Text>
                )}
              </Table.Td>
              {plans.map((plan) => {
                const f = planFeatures(plan);
                if (row.kind === "requests") {
                  return (
                    <Table.Td key={`${plan.id}-req`}>
                      <Text fw={600}>{plan.max_requests ?? "—"}</Text>
                    </Table.Td>
                  );
                }
                return (
                  <Table.Td key={`${plan.id}-${row.flag}`}>
                    <BoolCell value={f[row.flag]} />
                  </Table.Td>
                );
              })}
            </Table.Tr>
          ))}
          <Table.Tr>
            <Table.Td style={{ background: "var(--mantine-color-body)" }} />
            {plans.map((plan) => (
              <Table.Td key={`cta-${plan.id}`}>
                <Stack gap="xs">
                  {isAuthenticated() ? (
                    <Button
                      className="btn-metallic"
                      size="sm"
                      color={plan.tier.toLowerCase() === "pro" ? "teal" : "blue"}
                      variant={plan.tier.toLowerCase() === "pro" ? "filled" : "light"}
                      component={Link}
                      href={`/checkout/${plan.id}`}
                    >
                      {t("choose")}
                    </Button>
                  ) : (
                    <>
                      <Button
                        className="btn-metallic"
                        size="sm"
                        color={plan.tier.toLowerCase() === "pro" ? "teal" : "blue"}
                        variant={plan.tier.toLowerCase() === "pro" ? "filled" : "light"}
                        component={Link}
                        href={`/login?next=${encodeURIComponent(`/checkout/${plan.id}`)}`}
                      >
                        {t("loginForPayment")}
                      </Button>
                      <Button
                        className="btn-metallic"
                        size="xs"
                        color="gray"
                        variant="subtle"
                        component={Link}
                        href="/register"
                      >
                        {tNav("register")}
                      </Button>
                    </>
                  )}
                </Stack>
              </Table.Td>
            ))}
          </Table.Tr>
        </Table.Tbody>
      </Table>
    </ScrollArea>
  );
}
