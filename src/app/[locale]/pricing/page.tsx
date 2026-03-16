"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
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
  ActionIcon,
  Box,
} from "@mantine/core";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";

interface Plan {
  id: number;
  name: string;
  tier: string;
  price: string;
  currency: string;
  duration_days: number | null;
  max_devices: number;
  sort_order: number;
}

function formatDuration(
  days: number | null,
  t: (key: string, values?: Record<string, number>) => string
): string {
  if (days === null) return t("unlimited");
  if (days === 30) return t("month");
  if (days === 365) return t("year");
  return t("days", { count: days });
}

export default function PricingPage() {
  const t = useTranslations("pricing");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  const plansUrl = apiBase ? `${apiBase.replace(/\/$/, "")}/billing/plans/` : "";

  useEffect(() => {
    if (!plansUrl) {
      setError(t("apiError"));
      setLoading(false);
      return;
    }

    fetch(plansUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const list = Array.isArray(data) ? data : data.results ?? [];
        const sorted = [...list].sort(
          (a: Plan, b: Plan) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
        );
        setPlans(sorted);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : t("loadError"));
      })
      .finally(() => setLoading(false));
  }, [plansUrl, t]);

  const scroll = (dir: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = 320;
    const gap = 16;
    el.scrollBy({ left: (cardWidth + gap) * dir, behavior: "smooth" });
  };

  if (loading) {
    return (
      <Center py="xl">
        <Loader size="lg" />
      </Center>
    );
  }

  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        <Title order={1} ta="center">
          {t("title")}
        </Title>

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
          <Box>
            <Group justify="center" mb="md" gap="xs">
              <ActionIcon
                variant="light"
                size="xl"
                aria-label={t("prev")}
                onClick={() => scroll(-1)}
              >
                <IconChevronLeft size={24} />
              </ActionIcon>
              <ActionIcon
                variant="light"
                size="xl"
                aria-label={t("next")}
                onClick={() => scroll(1)}
              >
                <IconChevronRight size={24} />
              </ActionIcon>
            </Group>

            <Box
              ref={scrollRef}
              style={{
                display: "flex",
                gap: 16,
                overflowX: "auto",
                scrollSnapType: "x mandatory",
                scrollBehavior: "smooth",
                padding: "8px 0",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
              className="carousel-scroll"
            >
              {plans.map((plan) => (
                <Card
                  key={plan.id}
                  withBorder
                  shadow="sm"
                  radius="md"
                  p="xl"
                  miw={300}
                  maw={320}
                  style={{
                    flex: "0 0 300px",
                    scrollSnapAlign: "start",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <Stack gap="md" style={{ flex: 1 }}>
                    <Group justify="space-between">
                      <Title order={3}>{plan.name}</Title>
                      <Badge variant="light" size="lg">
                        {plan.tier}
                      </Badge>
                    </Group>

                    <Text size="xl" fw={700}>
                      {plan.price} {plan.currency}
                    </Text>

                    <Text size="sm" c="dimmed">
                      {formatDuration(plan.duration_days, t)}
                    </Text>

                    <Text size="sm">{t("devices", { count: plan.max_devices })}</Text>

                    <Button
                      className="btn-metallic"
                      color="silver"
                      component={Link}
                      href="/register"
                      variant="filled"
                      mt="auto"
                    >
                      {t("choose")}
                    </Button>
                  </Stack>
                </Card>
              ))}
            </Box>
          </Box>
        )}
      </Stack>
    </Container>
  );
}
