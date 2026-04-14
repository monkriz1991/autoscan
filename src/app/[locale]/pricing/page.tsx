"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Container, Text, Stack, Loader, Center, Notification } from "@mantine/core";
import { getPlans } from "@/lib/api";
import type { Plan } from "@/lib/api";
import { PricingPageContent } from "@/components/marketing/PricingPageContent";

export default function PricingPage() {
  const t = useTranslations("pricing");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getPlans()
      .then(setPlans)
      .catch((err) => {
        setError(err instanceof Error ? err.message : t("loadError"));
      })
      .finally(() => setLoading(false));
  }, [t]);

  if (loading) {
    return (
      <Center py="xl" style={{ minHeight: "50vh" }}>
        <Loader size="lg" />
      </Center>
    );
  }

  return (
    <Container
      size="xl"
      py="xl"
      px={{ base: "md", sm: "lg" }}
      className="marketing-page marketing-page--wide pricing-page"
    >
      <Stack gap="xl">
        <div className="marketing-page__hero">
          <h1 className="marketing-page__hero-title">{t("title")}</h1>
          <p className="marketing-page__hero-sub">{t("subtitle")}</p>
        </div>

        {error ? (
          <Notification color="red" onClose={() => setError("")}>
            {error}
          </Notification>
        ) : null}

        {!error && plans.length === 0 ? (
          <Text c="dimmed" ta="center" size="lg">
            {t("noPlans")}
          </Text>
        ) : null}

        {!error && plans.length > 0 ? <PricingPageContent plans={plans} /> : null}
      </Stack>
    </Container>
  );
}
