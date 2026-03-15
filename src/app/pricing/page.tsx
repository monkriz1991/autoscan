"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
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

function formatDuration(days: number | null): string {
  if (days === null) return "Бессрочно";
  if (days === 30) return "1 месяц";
  if (days === 365) return "1 год";
  return `${days} дн.`;
}

export default function PricingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  const plansUrl = apiBase ? `${apiBase.replace(/\/$/, "")}/billing/plans/` : "";

  useEffect(() => {
    if (!plansUrl) {
      setError("API не настроен (NEXT_PUBLIC_API_BASE_URL)");
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
        setError(err instanceof Error ? err.message : "Ошибка загрузки тарифов");
      })
      .finally(() => setLoading(false));
  }, [plansUrl]);

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
          Тарифы
        </Title>

        {error && (
          <Notification color="red" onClose={() => setError("")}>
            {error}
          </Notification>
        )}

        {!error && plans.length === 0 && (
          <Text c="dimmed" ta="center" size="lg">
            Тарифы пока не добавлены.
          </Text>
        )}

        {!error && plans.length > 0 && (
          <Box>
            <Group justify="center" mb="md" gap="xs">
              <ActionIcon
                variant="light"
                size="xl"
                aria-label="Предыдущий"
                onClick={() => scroll(-1)}
              >
                <IconChevronLeft size={24} />
              </ActionIcon>
              <ActionIcon
                variant="light"
                size="xl"
                aria-label="Следующий"
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
                      {formatDuration(plan.duration_days)}
                    </Text>

                    <Text size="sm">До {plan.max_devices} устройств</Text>

                    <Button
                      component={Link}
                      href="/register"
                      variant="filled"
                      mt="auto"
                    >
                      Выбрать
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
