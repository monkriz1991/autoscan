"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import {
  Container,
  Title,
  Card,
  Badge,
  Text,
  Stack,
  Group,
  Loader,
  Center,
  Notification,
  ActionIcon,
  Box,
  SimpleGrid,
} from "@mantine/core";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import PlanCheckoutButton from "@/components/billing/PlanCheckoutButton";

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

function PlanPricingCard({ plan, t }: { plan: Plan; t: ReturnType<typeof useTranslations<"pricing">> }) {
  return (
    <Card
      withBorder
      shadow="sm"
      radius="md"
      p="xl"
      h="100%"
      style={{ display: "flex", flexDirection: "column" }}
    >
      <Stack gap="md" style={{ flex: 1 }}>
        <Group justify="space-between" wrap="nowrap" gap="xs">
          <Title order={3} size="h4" lineClamp={2}>
            {plan.name}
          </Title>
          <Badge variant="light" size="lg" tt="capitalize">
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

        <PlanCheckoutButton plan={plan} />
      </Stack>
    </Card>
  );
}

export default function PricingPage() {
  const t = useTranslations("pricing");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const apiBase =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8001/api/v1";
  const plansUrl = `${apiBase.replace(/\/$/, "")}/billing/plans/`;

  useEffect(() => {
    fetch(plansUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const list = Array.isArray(data) ? data : data.results ?? [];
        const sorted = [...list].sort(
          (a: Plan, b: Plan) => (b.sort_order ?? 0) - (a.sort_order ?? 0)
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
    <Container size="xl" py="xl" px={{ base: "md", sm: "lg" }}>
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
          <>
            {/* Мобильный: горизонтальная карусель */}
            <Box hiddenFrom="md">
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
                  <Box
                    key={plan.id}
                    miw={300}
                    maw={320}
                    style={{
                      flex: "0 0 300px",
                      scrollSnapAlign: "start",
                    }}
                  >
                    <PlanPricingCard plan={plan} t={t} />
                  </Box>
                ))}
              </Box>
            </Box>

            {/* Планшет и десктоп: сетка, все карточки видны без горизонтального скролла */}
            <SimpleGrid
              visibleFrom="md"
              cols={{ md: 2, lg: 3, xl: 5 }}
              spacing="md"
            >
              {plans.map((plan) => (
                <PlanPricingCard key={plan.id} plan={plan} t={t} />
              ))}
            </SimpleGrid>
          </>
        )}
      </Stack>
    </Container>
  );
}
