"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Box, Center, Loader, Notification, Stack, Text, Title } from "@mantine/core";
import { getPlans, type Plan } from "@/lib/api";
import { PricingPlansGrid } from "@/components/marketing/PricingPlanCards";

/**
 * Тарифы с главной: тот же источник и полный набор, что и на /marketing/pricing
 * (GET /billing/plans/, без фильтрации по периоду — как PricingPageContent).
 */
export default function PricingSection() {
  const t = useTranslations("landing.pricing");
  const tp = useTranslations("pricing");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getPlans()
      .then(setPlans)
      .catch((err) => {
        setError(err instanceof Error ? err.message : tp("loadError"));
      })
      .finally(() => setLoading(false));
  }, [tp]);

  return (
    <Stack component="section" gap="xl" py={56} id="pricing" className="landing-pricing">
      <Box>
        <Title order={2} className="landing-section-title">
          {t("title")}
        </Title>
        <Text mt="sm" size="md" className="landing-pricing__lead">
          {t("subtitle")}
        </Text>
      </Box>

      {loading ? (
        <Center py="xl" style={{ minHeight: 200 }}>
          <Loader size="lg" />
        </Center>
      ) : null}

      {!loading && error ? (
        <Notification color="red" onClose={() => setError("")}>
          {error}
        </Notification>
      ) : null}

      {!loading && !error && plans.length === 0 ? (
        <Text c="dimmed" ta="center" size="lg">
          {tp("noPlans")}
        </Text>
      ) : null}

      {!loading && !error && plans.length > 0 ? (
        <Box className="landing-pricing__grid landing-pricing__grid--api">
          <PricingPlansGrid plans={plans} />
        </Box>
      ) : null}

      {t("footnote").trim() ? (
        <Text size="sm" ta="center" className="landing-pricing__footnote">
          {t("footnote")}
        </Text>
      ) : null}
    </Stack>
  );
}
