"use client";

import { useTranslations } from "next-intl";
import { Box, Divider, Group, SimpleGrid, Stack, Text, ThemeIcon, Title } from "@mantine/core";
import { IconCheck, IconX } from "@tabler/icons-react";
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

export function planFeatures(plan: Plan): PlanFeatures {
  return plan.features ?? defaultFeatures;
}

function durationSortKey(durationDays: number | null): number {
  if (durationDays === null) return 0;
  if (durationDays === 30) return 1;
  if (durationDays === 365) return 2;
  return 3;
}

export function sortPlansForDisplay(plans: Plan[]): Plan[] {
  return [...plans].sort((a, b) => {
    const ta = TIER_ORDER[a.tier.toLowerCase()] ?? 99;
    const tb = TIER_ORDER[b.tier.toLowerCase()] ?? 99;
    if (ta !== tb) return ta - tb;
    const da = durationSortKey(a.duration_days);
    const db = durationSortKey(b.duration_days);
    if (da !== db) return da - db;
    return a.id - b.id;
  });
}

export function isFreeTier(plan: Plan): boolean {
  const tier = plan.tier.toLowerCase();
  if (tier === "free") return true;
  const n = parseFloat(plan.price);
  return Number.isFinite(n) && n <= 0;
}

export function isFeaturedPlan(plan: Plan): boolean {
  // Флаг «рекомендуем»: только месячный Pro — при двух строках tier=pro (30/365) один бейдж.
  if (plan.tier.toLowerCase() !== "pro") return false;
  return plan.duration_days !== 365;
}

function tierRank(plan: Plan): number {
  return TIER_ORDER[plan.tier.toLowerCase()] ?? 99;
}

type FeatureRowProps = { yes: boolean; compact?: boolean };

function FeatureRowYesNo({ yes, compact }: FeatureRowProps) {
  const tA11y = useTranslations("a11y");
  const size = compact ? 14 : 16;
  const box = compact ? 22 : 26;
  if (yes) {
    return (
      <ThemeIcon
        size={box}
        radius="md"
        variant="light"
        color="teal"
        className="pricing-v2-card__icon pricing-v2-card__icon--yes"
        aria-label={tA11y("featureYes")}
      >
        <IconCheck size={size} stroke={2.5} />
      </ThemeIcon>
    );
  }
  return (
    <ThemeIcon
      size={box}
      radius="md"
      variant="light"
      color="gray"
      className="pricing-v2-card__icon pricing-v2-card__icon--no"
      aria-label={tA11y("featureNo")}
    >
      <IconX size={size} stroke={2} />
    </ThemeIcon>
  );
}

export type PlanCardProps = { plan: Plan; compact?: boolean };

export function PlanCard({ plan, compact }: PlanCardProps) {
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
  const proOrHigher = tierRank(plan) >= TIER_ORDER.pro;
  const predictiveMaintenance = f.predictive_maintenance_alerts ?? proOrHigher;
  const aiBlogSearch = f.ai_blog_search ?? proOrHigher;
  const aiChatAssistant = f.ai_chat_assistant ?? proOrHigher;

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
        <Text size="sm" className="pricing-v2-card__period">
          {period}
        </Text>
      ) : (
        <Text size="sm" className="pricing-v2-card__period">
          {t("freeForever")}
        </Text>
      )}

      <Text size="sm" mt="xs" lh={1.5} className="pricing-v2-card__devices">
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
          <FeatureRowYesNo yes={predictiveMaintenance} compact={compact} />
          <Text size="sm">{t("feature_predictive_maintenance")}</Text>
        </Group>
        <Group gap="sm" wrap="nowrap" align="flex-start">
          <FeatureRowYesNo yes={aiBlogSearch} compact={compact} />
          <Text size="sm">{t("feature_ai_blog_search")}</Text>
        </Group>
        <Group gap="sm" wrap="nowrap" align="flex-start">
          <FeatureRowYesNo yes={aiChatAssistant} compact={compact} />
          <Text size="sm">{t("feature_ai_chat_assistant")}</Text>
        </Group>
        <Group gap="sm" wrap="nowrap" align="flex-start">
          <FeatureRowYesNo yes={!free} compact={compact} />
          <Text size="sm">{free ? t("supportCommunity") : t("supportStandard")}</Text>
        </Group>
      </Stack>

      <Box mt="auto" pt="md">
        <PlanCheckoutButton plan={plan} />
        {free ? (
          <Text size="sm" ta="center" mt="md" className="pricing-v2-card__footnote">
            {t("freeNoCreditCard")}
          </Text>
        ) : null}
      </Box>
    </Box>
  );
}

export type PricingPlansGridProps = { plans: Plan[] };

/** Сетка карточек тарифов (как верх страницы /pricing). */
export function PricingPlansGrid({ plans }: PricingPlansGridProps) {
  const sorted = sortPlansForDisplay(plans);
  const n = sorted.length;
  const lgCols = n <= 1 ? 1 : n === 2 ? 2 : n === 3 ? 3 : 4;

  return (
    <SimpleGrid cols={{ base: 1, sm: n >= 3 ? 2 : n, lg: lgCols }} spacing="lg">
      {sorted.map((plan) => (
        <PlanCard key={plan.id} plan={plan} compact={n >= 4} />
      ))}
    </SimpleGrid>
  );
}
