"use client";

import type { CSSProperties } from "react";
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

/** Доля ширины первой колонки (фичи); остальное делится между планами поровну. */
function labelColumnPercent(planCount: number): number {
  if (planCount >= 5) return 22;
  if (planCount >= 4) return 24;
  return 26;
}

export function PricingTable({ plans }: PricingTableProps) {
  const t = useTranslations("pricing");
  const tNav = useTranslations("nav");
  const n = plans.length;
  const compact = n >= 4;
  const tight = n >= 5;
  const labelPct = labelColumnPercent(n);
  const planPct = n > 0 ? (100 - labelPct) / n : 0;

  const hSpacing = compact ? "sm" : "md";
  const vSpacing = compact ? "xs" : "sm";

  function formatDuration(days: number | null): string {
    if (days === null) return t("unlimited");
    if (days === 30) return t("month");
    if (days === 365) return t("year");
    return t("days", { count: days });
  }

  function BoolCell({ value }: { value: boolean }) {
    const iconSize = tight ? 14 : compact ? 15 : 16;
    const box = tight ? 24 : compact ? 26 : 28;
    if (value) {
      return (
        <ThemeIcon size={box} radius="md" variant="light" color="teal" aria-label="yes">
          <IconCheck size={iconSize} stroke={2.5} />
        </ThemeIcon>
      );
    }
    return (
      <ThemeIcon size={box} radius="md" variant="light" color="gray" aria-label="no">
        <IconMinus size={iconSize} />
      </ThemeIcon>
    );
  }

  const firstColStyle: CSSProperties = {
    width: `${labelPct}%`,
    maxWidth: tight ? 200 : compact ? 220 : 280,
    fontWeight: 500,
    whiteSpace: "normal",
    background: "var(--mantine-color-body)",
    position: "sticky",
    left: 0,
    zIndex: 2,
    boxShadow: "4px 0 8px -6px rgba(0,0,0,0.12)",
  };

  const planColStyle: CSSProperties = {
    width: `${planPct}%`,
    verticalAlign: "top",
    wordBreak: "break-word",
  };

  return (
    <ScrollArea type="scroll" offsetScrollbars w="100%" maw="100%">
      <Table
        stickyHeader
        horizontalSpacing={hSpacing}
        verticalSpacing={vSpacing}
        striped
        highlightOnHover
        style={{ width: "100%", tableLayout: "fixed", minWidth: 0 }}
      >
        <colgroup>
          <col style={{ width: `${labelPct}%` }} />
          {plans.map((plan) => (
            <col key={plan.id} style={{ width: `${planPct}%` }} />
          ))}
        </colgroup>
        <Table.Thead>
          <Table.Tr>
            <Table.Th style={firstColStyle} />
            {plans.map((plan) => {
              const tier = plan.tier.toLowerCase();
              const isPopular = tier === "pro";
              return (
                <Table.Th key={plan.id} style={planColStyle}>
                  <Stack gap={tight ? 4 : compact ? "xs" : "sm"} align="flex-start">
                    <Badge
                      size={tight ? "sm" : compact ? "md" : "lg"}
                      variant={isPopular ? "filled" : "light"}
                      color={isPopular ? "teal" : "blue"}
                      tt="capitalize"
                    >
                      {plan.tier}
                    </Badge>
                    <Text fw={700} size={tight ? "sm" : compact ? "md" : "lg"} lineClamp={2}>
                      {plan.name}
                    </Text>
                    <Group gap={4} align="baseline" wrap="nowrap">
                      <Text size={tight ? "md" : compact ? "lg" : "xl"} fw={700}>
                        {plan.price}
                      </Text>
                      <Text size="xs" c="dimmed">
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
              <Table.Td style={firstColStyle}>
                {row.kind === "requests" ? (
                  <Text size={tight ? "xs" : "sm"}>{t(row.labelKey as "feature_ai_requests")}</Text>
                ) : (
                  <Text size={tight ? "xs" : "sm"}>
                    {t(row.labelKey as "feature_unlimited_devices")}
                  </Text>
                )}
              </Table.Td>
              {plans.map((plan) => {
                const f = planFeatures(plan);
                if (row.kind === "requests") {
                  return (
                    <Table.Td key={`${plan.id}-req`} style={planColStyle}>
                      <Text fw={600} size={tight ? "sm" : "md"}>
                        {plan.max_requests ?? "—"}
                      </Text>
                    </Table.Td>
                  );
                }
                return (
                  <Table.Td key={`${plan.id}-${row.flag}`} style={planColStyle}>
                    <BoolCell value={f[row.flag]} />
                  </Table.Td>
                );
              })}
            </Table.Tr>
          ))}
          <Table.Tr>
            <Table.Td style={firstColStyle} />
            {plans.map((plan) => (
              <Table.Td key={`cta-${plan.id}`} style={planColStyle}>
                <Stack gap="xs">
                  {isAuthenticated() ? (
                    <Button
                      className="btn-metallic"
                      size={tight ? "xs" : "sm"}
                      color={plan.tier.toLowerCase() === "pro" ? "teal" : "blue"}
                      variant={plan.tier.toLowerCase() === "pro" ? "filled" : "light"}
                      component={Link}
                      href={`/checkout/${plan.id}`}
                      fullWidth
                    >
                      {t("choose")}
                    </Button>
                  ) : (
                    <>
                      <Button
                        className="btn-metallic"
                        size={tight ? "xs" : "sm"}
                        color={plan.tier.toLowerCase() === "pro" ? "teal" : "blue"}
                        variant={plan.tier.toLowerCase() === "pro" ? "filled" : "light"}
                        component={Link}
                        href={`/login?next=${encodeURIComponent(`/checkout/${plan.id}`)}`}
                        fullWidth
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
                        fullWidth
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
