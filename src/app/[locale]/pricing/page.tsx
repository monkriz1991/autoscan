"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  Container,
  Title,
  Text,
  Stack,
  Loader,
  Center,
  Notification,
  Box,
} from "@mantine/core";
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
      className="marketing-page marketing-page--wide"
    >
      <Stack gap="xl">
        <Box ta="center">
          <Title order={1} mb="md">
            {t("title")}
          </Title>
          <Text c="dimmed" size="lg" maw={640} mx="auto">
            {t("subtitle")}
          </Text>
        </Box>

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
