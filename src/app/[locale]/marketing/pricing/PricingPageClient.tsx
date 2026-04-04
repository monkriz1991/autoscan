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
import { PricingTable } from "@/components/ui/PricingTable";

export default function PricingPageClient() {
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
    <section>
      <Box component="header" py={{ base: "xl", md: 80 }}>
        <Container size="lg">
          <Stack gap="xl">
            <Box ta="center" mb="xl">
              <Title order={1} mb="md">
                {t("title")}
              </Title>
              <Text c="dimmed" size="lg" maw={600} mx="auto">
                {t("subtitle")}
              </Text>
            </Box>

            {error && (
              <Notification color="red" onClose={() => setError("")}>
                {error}
              </Notification>
            )}

            {!error && plans.length === 0 && (
              <Text c="dimmed" ta="center" size="lg">
                {t("noPlans")}
              </Text>
            )}

            {!error && plans.length > 0 && (
              <Box component="section" aria-label={t("title")}>
                <PricingTable plans={plans} />
              </Box>
            )}
          </Stack>
        </Container>
      </Box>
    </section>
  );
}
