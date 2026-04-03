"use client";

import { useState, useEffect } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import {
  Container,
  Title,
  Card,
  Badge,
  Text,
  Button,
  Stack,
  Group,
  Loader,
  Center,
  Notification,
  Box,
  SimpleGrid,
  List,
  ThemeIcon,
} from "@mantine/core";
import { IconCheck } from "@tabler/icons-react";
import { getPlans, isAuthenticated } from "@/lib/api";
import type { Plan } from "@/lib/api";

export default function PricingPageClient() {
  const t = useTranslations("pricing");
  const tNav = useTranslations("nav");
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

  function formatDuration(days: number | null): string {
    if (days === null) return t("unlimited");
    if (days === 30) return t("month");
    if (days === 365) return t("year");
    return t("days", { count: days });
  }

  if (loading) {
    return (
      <Center py="xl" style={{ minHeight: "50vh" }}>
        <Loader size="lg" />
      </Center>
    );
  }

  return (
    <Box component="section" py={{ base: "xl", md: 80 }}>
      <Container size="lg">
        <Stack gap="xl">
          <Box component="header" ta="center" mb="xl">
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
            <SimpleGrid cols={{ base: 1, sm: 2, lg: Math.min(plans.length, 3) }} spacing="xl">
              {plans.map((plan, index) => {
                const isPopular =
                  plan.tier.toLowerCase() === "pro" || (plans.length > 1 && index === 1);

                return (
                  <Card
                    key={plan.id}
                    withBorder
                    shadow={isPopular ? "xl" : "sm"}
                    radius="md"
                    p="xl"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      borderColor: isPopular ? "var(--mantine-color-teal-5)" : undefined,
                      transform: isPopular ? "scale(1.02)" : "none",
                      transition: "transform 0.2s ease",
                      position: "relative",
                      zIndex: isPopular ? 1 : 0,
                    }}
                  >
                    {isPopular && (
                      <Badge
                        color="teal"
                        variant="filled"
                        size="lg"
                        style={{
                          position: "absolute",
                          top: 16,
                          right: 16,
                        }}
                      >
                        {t("popular")}
                      </Badge>
                    )}

                    <Stack gap="md" style={{ flex: 1 }}>
                      <Box>
                        <Badge variant="light" size="lg" mb="sm" color={isPopular ? "teal" : "blue"}>
                          {plan.tier}
                        </Badge>
                        <Title order={3}>{plan.name}</Title>
                      </Box>

                      <Group align="flex-end" gap="xs">
                        <Text size="3rem" fw={700} lh={1}>
                          {plan.price}
                        </Text>
                        <Text size="xl" c="dimmed" fw={500} mb={6}>
                          {plan.currency}
                        </Text>
                      </Group>

                      <Text size="sm" c="dimmed">
                        {formatDuration(plan.duration_days)}
                      </Text>

                      <List
                        mt="md"
                        spacing="sm"
                        size="sm"
                        center
                        icon={
                          <ThemeIcon color="teal" size={20} radius="xl">
                            <IconCheck size={14} />
                          </ThemeIcon>
                        }
                      >
                        <List.Item>{t("devices", { count: plan.max_devices })}</List.Item>
                        <List.Item>{t("featureRequests", { count: plan.max_requests || 100 })}</List.Item>
                        <List.Item>{t("featureAi")}</List.Item>
                        <List.Item>{t("featureLive")}</List.Item>
                        <List.Item>{t("featureHistory")}</List.Item>
                      </List>

                      <Stack gap="xs" mt="auto" pt="xl">
                        {isAuthenticated() ? (
                          <Button
                            className="btn-metallic"
                            color={isPopular ? "teal" : "blue"}
                            variant={isPopular ? "filled" : "light"}
                            size="md"
                            component={Link}
                            href={`/checkout/${plan.id}`}
                          >
                            {t("choose")}
                          </Button>
                        ) : (
                          <Button
                            className="btn-metallic"
                            color={isPopular ? "teal" : "blue"}
                            variant={isPopular ? "filled" : "light"}
                            size="md"
                            component={Link}
                            href={`/login?next=${encodeURIComponent(`/checkout/${plan.id}`)}`}
                          >
                            {t("loginForPayment")}
                          </Button>
                        )}
                        {!isAuthenticated() && (
                          <Button
                            className="btn-metallic"
                            color="silver"
                            variant="subtle"
                            component={Link}
                            href="/register"
                          >
                            {tNav("register")}
                          </Button>
                        )}
                      </Stack>
                    </Stack>
                  </Card>
                );
              })}
            </SimpleGrid>
          )}
        </Stack>
      </Container>
    </Box>
  );
}
