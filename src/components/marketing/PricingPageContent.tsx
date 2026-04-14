"use client";

import type { CSSProperties } from "react";
import { useTranslations } from "next-intl";
import {
  Accordion,
  Box,
  Divider,
  Group,
  SimpleGrid,
  Stack,
  Table,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { IconCheck, IconMinus, IconX } from "@tabler/icons-react";
import type { Plan, PlanFeatures } from "@/lib/api";
import PlanCheckoutButton from "@/components/billing/PlanCheckoutButton";

/** Порядок колонок: слева направо от бесплатного к Pro. */
const TIER_ORDER: Record<string, number> = {
  free: 0,
  lite: 1,
  basic: 2,
  pro: 3,
  premium: 4,
};

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

function sortPlansForDisplay(plans: Plan[]): Plan[] {
  return [...plans].sort((a, b) => {
    const ta = TIER_ORDER[a.tier.toLowerCase()] ?? 99;
    const tb = TIER_ORDER[b.tier.toLowerCase()] ?? 99;
    return ta - tb;
  });
}

function isFreeTier(plan: Plan): boolean {
  const tier = plan.tier.toLowerCase();
  if (tier === "free") return true;
  const n = parseFloat(plan.price);
  return Number.isFinite(n) && n <= 0;
}

function isFeaturedPlan(plan: Plan): boolean {
  // Флаг «рекомендуем»: основной платный апгрейд для конверсии.
  return plan.tier.toLowerCase() === "pro";
}

type FeatureRowProps = { yes: boolean; compact?: boolean };

function FeatureRowYesNo({ yes, compact }: FeatureRowProps) {
  const size = compact ? 14 : 16;
  const box = compact ? 22 : 26;
  if (yes) {
    return (
      <ThemeIcon size={box} radius="md" variant="light" color="teal" aria-label="yes">
        <IconCheck size={size} stroke={2.5} />
      </ThemeIcon>
    );
  }
  return (
    <ThemeIcon size={box} radius="md" variant="light" color="gray" aria-label="no">
      <IconX size={size} stroke={2} />
    </ThemeIcon>
  );
}

type PlanCardProps = { plan: Plan; compact?: boolean };

function PlanCard({ plan, compact }: PlanCardProps) {
  const t = useTranslations("pricing");
  const f = planFeatures(plan);
  const free = isFreeTier(plan);
  const featured = isFeaturedPlan(plan);

  const devicesNote = f.unlimited_devices
    ? t("devicesUnlimited_explained")
    : t("devicesLimited_explained", { count: plan.max_devices });

  const period =
    plan.duration_days === null
      ? t("unlimited")
      : plan.duration_days === 30
        ? t("periodBilledMonthly")
        : plan.duration_days === 365
          ? t("periodBilledYearly")
          : t("days", { count: plan.duration_days });

  const priceMain = free ? t("freePriceDisplay") : `${plan.price} ${plan.currency}`;
  const aiCount = plan.max_requests ?? 0;

  return (
    <Box
      className={`pricing-v2-card${featured ? " pricing-v2-card--featured" : ""}`}
      p={{ base: "lg", md: "xl" }}
      style={{ display: "flex", flexDirection: "column", height: "100%" }}
    >
      {featured ? (
        <Text className="pricing-v2-card__badge" size="xs" fw={600}>
          {t("badgeMostPopular")}
        </Text>
      ) : null}

      <Title order={3} className="pricing-v2-card__name" mt={featured ? 4 : 0}>
        {plan.name}
      </Title>

      <Text className="pricing-v2-card__price">{priceMain}</Text>
      {!free ? (
        <Text size="sm" c="dimmed" className="pricing-v2-card__period">
          {period}
        </Text>
      ) : (
        <Text size="sm" c="dimmed" className="pricing-v2-card__period">
          {t("freeForever")}
        </Text>
      )}

      <Text size="xs" c="dimmed" mt="xs" lh={1.5}>
        {devicesNote}
      </Text>

      <Divider my="lg" className="pricing-v2-card__divider" />

      <Stack gap="sm" className="pricing-v2-card__features" style={{ flex: 1 }}>
        <Group gap="sm" wrap="nowrap" align="flex-start">
          <FeatureRowYesNo yes={f.scan_errors} compact={compact} />
          <Text size="sm">{t("feature_scan_errors")}</Text>
        </Group>
        <Group gap="sm" wrap="nowrap" align="flex-start">
          <FeatureRowYesNo yes={aiCount > 0} compact={compact} />
          <Text size="sm">{t("cardLine_ai", { count: aiCount })}</Text>
        </Group>
        <Group gap="sm" wrap="nowrap" align="flex-start">
          <FeatureRowYesNo yes={f.view_params} compact={compact} />
          <Text size="sm">{t("compare_live")}</Text>
        </Group>
        <Group gap="sm" wrap="nowrap" align="flex-start">
          <FeatureRowYesNo yes={f.record_params} compact={compact} />
          <Text size="sm">{t("compare_export")}</Text>
        </Group>
        <Group gap="sm" wrap="nowrap" align="flex-start">
          <FeatureRowYesNo yes={f.metrics_history} compact={compact} />
          <Text size="sm">{t("compare_history")}</Text>
        </Group>
        <Group gap="sm" wrap="nowrap" align="flex-start">
          <FeatureRowYesNo yes={!free} compact={compact} />
          <Text size="sm">{free ? t("supportCommunity") : t("supportStandard")}</Text>
        </Group>
      </Stack>

      <Box mt="auto" pt="md">
        <PlanCheckoutButton plan={plan} />
        {free ? (
          <Text size="xs" c="dimmed" ta="center" mt="md">
            {t("freeNoCreditCard")}
          </Text>
        ) : null}
      </Box>
    </Box>
  );
}

function ComparisonTable({ plans }: { plans: Plan[] }) {
  const t = useTranslations("pricing");
  const n = plans.length;
  const labelPct = n >= 4 ? 22 : 26;
  const planPct = n > 0 ? (100 - labelPct) / n : 0;
  const compact = n >= 4;

  const firstColStyle: CSSProperties = {
    width: `${labelPct}%`,
    maxWidth: compact ? 200 : 240,
    fontWeight: 500,
    whiteSpace: "normal",
    background: "var(--mantine-color-body)",
    position: "sticky",
    left: 0,
    zIndex: 2,
    boxShadow: "4px 0 12px -8px rgba(15, 23, 42, 0.12)",
  };

  const planColStyle: CSSProperties = {
    width: `${planPct}%`,
    verticalAlign: "top",
    wordBreak: "break-word",
  };

  function supportLabel(plan: Plan): string {
    if (isFreeTier(plan)) return t("supportCommunity");
    if (plan.tier.toLowerCase() === "pro") return t("supportPriority");
    return t("supportStandard");
  }

  function BoolCell({ value }: { value: boolean }) {
    const iconSize = compact ? 14 : 15;
    const box = compact ? 24 : 28;
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

  return (
    <Box className="pricing-v2-compare-wrap" style={{ overflowX: "auto" }}>
      <Table
        className="pricing-v2-compare"
        horizontalSpacing="md"
        verticalSpacing="sm"
        style={{ minWidth: 520, tableLayout: "fixed" }}
      >
        <colgroup>
          <col style={{ width: `${labelPct}%` }} />
          {plans.map((plan) => (
            <col key={plan.id} style={{ width: `${planPct}%` }} />
          ))}
        </colgroup>
        <Table.Thead>
          <Table.Tr>
            <Table.Th style={firstColStyle} className="pricing-v2-compare__corner">
              {t("compareCol_feature")}
            </Table.Th>
            {plans.map((plan) => {
              const free = isFreeTier(plan);
              const priceLine = free ? t("freePriceDisplay") : `${plan.price} ${plan.currency}`;
              return (
                <Table.Th key={plan.id} style={planColStyle} className="pricing-v2-compare__head-cell">
                  <Stack gap={4} align="flex-start">
                    <Text fw={700} size={compact ? "sm" : "md"}>
                      {plan.name}
                    </Text>
                    <Text fw={600} size={compact ? "md" : "lg"} className="pricing-v2-compare__head-price">
                      {priceLine}
                    </Text>
                  </Stack>
                </Table.Th>
              );
            })}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          <Table.Tr>
            <Table.Td style={firstColStyle}>{t("compare_ai")}</Table.Td>
            {plans.map((plan) => (
              <Table.Td key={`${plan.id}-ai`} style={planColStyle}>
                <Text fw={600} size="sm">
                  {plan.max_requests ?? "—"}
                </Text>
              </Table.Td>
            ))}
          </Table.Tr>
          <Table.Tr>
            <Table.Td style={firstColStyle}>{t("compare_live")}</Table.Td>
            {plans.map((plan) => (
              <Table.Td key={`${plan.id}-live`} style={planColStyle}>
                <BoolCell value={planFeatures(plan).view_params} />
              </Table.Td>
            ))}
          </Table.Tr>
          <Table.Tr>
            <Table.Td style={firstColStyle}>{t("compare_export")}</Table.Td>
            {plans.map((plan) => (
              <Table.Td key={`${plan.id}-ex`} style={planColStyle}>
                <BoolCell value={planFeatures(plan).record_params} />
              </Table.Td>
            ))}
          </Table.Tr>
          <Table.Tr>
            <Table.Td style={firstColStyle}>{t("compare_history")}</Table.Td>
            {plans.map((plan) => (
              <Table.Td key={`${plan.id}-hi`} style={planColStyle}>
                <BoolCell value={planFeatures(plan).metrics_history} />
              </Table.Td>
            ))}
          </Table.Tr>
          <Table.Tr>
            <Table.Td style={firstColStyle}>{t("compare_support")}</Table.Td>
            {plans.map((plan) => (
              <Table.Td key={`${plan.id}-su`} style={planColStyle}>
                <Text size="sm">{supportLabel(plan)}</Text>
              </Table.Td>
            ))}
          </Table.Tr>
        </Table.Tbody>
      </Table>
    </Box>
  );
}

function TrustStrip() {
  const t = useTranslations("pricing");
  return (
    <Box className="pricing-v2-trust" mt="xl">
      <Group justify="center" gap="xl" wrap="wrap">
        <Text size="sm" className="pricing-v2-trust__item">
          {t("trust_moneyBack")}
        </Text>
        <Text size="sm" className="pricing-v2-trust__item">
          {t("trust_securePay")}
        </Text>
      </Group>
      <Text size="xs" c="dimmed" ta="center" mt="md">
        {t("trust_payLabel")}
      </Text>
      <Group justify="center" gap="xs" mt="sm" wrap="wrap">
        <span className="pricing-v2-pay-pill">Visa</span>
        <span className="pricing-v2-pay-pill">Mastercard</span>
        <span className="pricing-v2-pay-pill">Crypto</span>
      </Group>
    </Box>
  );
}

function PricingFaq() {
  const t = useTranslations("pricing");
  return (
    <Stack gap="md" mt={56} className="pricing-v2-faq">
      <Title order={2} size="h3" className="pricing-v2-section-title">
        {t("faqTitle")}
      </Title>
      <Accordion variant="separated" radius="md" className="pricing-v2-faq__accordion">
        <Accordion.Item value="switch">
          <Accordion.Control>{t("faq_switch_q")}</Accordion.Control>
          <Accordion.Panel>
            <Text size="sm" c="dimmed">
              {t("faq_switch_a")}
            </Text>
          </Accordion.Panel>
        </Accordion.Item>
        <Accordion.Item value="trial">
          <Accordion.Control>{t("faq_trial_q")}</Accordion.Control>
          <Accordion.Panel>
            <Text size="sm" c="dimmed">
              {t("faq_trial_a")}
            </Text>
          </Accordion.Panel>
        </Accordion.Item>
        <Accordion.Item value="limit">
          <Accordion.Control>{t("faq_limit_q")}</Accordion.Control>
          <Accordion.Panel>
            <Text size="sm" c="dimmed">
              {t("faq_limit_a")}
            </Text>
          </Accordion.Panel>
        </Accordion.Item>
        <Accordion.Item value="annual">
          <Accordion.Control>{t("faq_annual_q")}</Accordion.Control>
          <Accordion.Panel>
            <Text size="sm" c="dimmed">
              {t("faq_annual_a")}
            </Text>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </Stack>
  );
}

export type PricingPageContentProps = {
  plans: Plan[];
};

/** Карточки, сравнительная таблица, FAQ и блок доверия для витрины тарифов. */
export function PricingPageContent({ plans }: PricingPageContentProps) {
  const t = useTranslations("pricing");
  const sorted = sortPlansForDisplay(plans);
  const n = sorted.length;
  const lgCols = n <= 1 ? 1 : n === 2 ? 2 : n === 3 ? 3 : 4;

  return (
    <Stack gap={0}>
      <SimpleGrid cols={{ base: 1, sm: n >= 3 ? 2 : n, lg: lgCols }} spacing="lg">
        {sorted.map((plan) => (
          <PlanCard key={plan.id} plan={plan} compact={n >= 4} />
        ))}
      </SimpleGrid>

      <Stack gap="md" mt={56}>
        <Title order={2} size="h3" ta="center" className="pricing-v2-section-title">
          {t("compareTitle")}
        </Title>
        <ComparisonTable plans={sorted} />
      </Stack>

      <PricingFaq />
      <TrustStrip />
    </Stack>
  );
}
