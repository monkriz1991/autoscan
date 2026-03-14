"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Title,
  Card,
  Text,
  Button,
  Stack,
  Loader,
  Center,
  Notification,
  Progress,
  Select,
  NumberInput,
  Group,
} from "@mantine/core";
import {
  getBillingStatus,
  getPlans,
  getUsageStatus,
  getOnDemandSettings,
  updateOnDemandSettings,
} from "@/lib/api";
import type { BillingStatus, OnDemandSettings, Plan } from "@/lib/api";

function formatExpires(expiresAt: string | undefined): string {
  if (!expiresAt) return "";
  try {
    const d = new Date(expiresAt);
    const now = new Date();
    const diffMs = d.getTime() - now.getTime();
    const diffDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    const formatted = d.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "short",
    });
    return `Сброс ${formatted} (${diffDays} дн.)`;
  } catch {
    return expiresAt;
  }
}

function findPlanPrice(plans: Plan[], planName: string | null | undefined): string {
  if (!planName) return "—";
  const plan = plans.find((p) => p.name.toLowerCase() === planName.toLowerCase());
  return plan ? `${plan.price} ${plan.currency}` : "—";
}

export default function SuperadminDashboardPage() {
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [usage, setUsage] = useState<{ plan_name: string; request_limit: number; requests_used: number; period: string } | null>(null);
  const [onDemand, setOnDemand] = useState<OnDemandSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [limitType, setLimitType] = useState<string>("fixed");
  const [limitAmount, setLimitAmount] = useState<number | string>(10);
  const [savingOnDemand, setSavingOnDemand] = useState(false);

  const loadData = () => {
    Promise.all([
      getBillingStatus().catch(() => null),
      getPlans().catch(() => []),
      getUsageStatus().catch(() => null),
      getOnDemandSettings().catch(() => null),
    ]).then(([b, p, u, o]) => {
      setBilling(b ?? null);
      setPlans(Array.isArray(p) ? p : []);
      setUsage(u ?? null);
      if (o) {
        setOnDemand(o);
        setLimitType(o.limit_type);
        setLimitAmount(o.limit_amount ?? 10);
      }
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveOnDemand = async () => {
    setError("");
    setSuccess("");
    setSavingOnDemand(true);
    try {
      const updated = await updateOnDemandSettings({
        limit_type: limitType as "fixed" | "unlimited",
        limit_amount: limitType === "fixed" ? Number(limitAmount) : null,
      });
      setOnDemand(updated);
      setSuccess("Настройки on-demand сохранены");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка сохранения");
    } finally {
      setSavingOnDemand(false);
    }
  };

  const planName = billing?.plan ?? "Free";
  const planPrice =
    planName === "Free" ? "Бесплатно" : findPlanPrice(plans, billing?.plan);
  const isFree = !billing?.plan || billing?.status === "none";

  const usagePercent =
    usage && usage.request_limit > 0
      ? Math.min(100, (usage.requests_used / usage.request_limit) * 100)
      : 0;

  const onDemandUsed = 0;
  const onDemandLimit =
    onDemand?.limit_type === "fixed" && onDemand?.limit_amount != null
      ? Number(onDemand.limit_amount)
      : 0;
  const onDemandPercent = onDemandLimit > 0 ? (onDemandUsed / onDemandLimit) * 100 : 0;

  if (loading) {
    return (
      <Center py="xl">
        <Loader size="lg" />
      </Center>
    );
  }

  return (
    <Stack gap="xl">
      <Title order={1}>Plan &amp; Usage</Title>

      {error && (
        <Notification color="red" onClose={() => setError("")}>
          {error}
        </Notification>
      )}
      {success && (
        <Notification color="green" onClose={() => setSuccess("")}>
          {success}
        </Notification>
      )}

      <Card withBorder p="lg" radius="md" shadow="sm">
        <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb="sm">
          Current Plan
        </Text>
        <Title order={3} mb="xs">
          {planName}
        </Title>
        <Text size="lg" mb="xs">
          {planPrice}
        </Text>
        {!isFree && billing?.expires_at && (
          <Text size="sm" c="dimmed" mb="md">
            {formatExpires(billing.expires_at)}
          </Text>
        )}
        <Button
          component={Link}
          href="/marketing/pricing"
          variant="light"
          size="sm"
        >
          Manage
        </Button>
      </Card>

      {usage && (
        <Card withBorder p="lg" radius="md" shadow="sm">
          <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb="md">
            Включено в {usage.plan_name}
          </Text>
          <Group justify="space-between" mb="xs">
            <Text size="sm" fw={500}>
              Total
            </Text>
            <Text size="lg" fw={600}>
              {Math.round(usagePercent)}%
            </Text>
          </Group>
          <Progress value={usagePercent} color="green" size="lg" radius="xl" mb="xs" />
          <Text size="sm" c="dimmed">
            {usage.requests_used} из {usage.request_limit} запросов использовано
          </Text>
        </Card>
      )}

      <Card withBorder p="lg" radius="md" shadow="sm">
        <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb="md">
          On-Demand Usage
        </Text>

        <Group justify="space-between" mb="xs">
          <Text size="sm" fw={500}>
            On-Demand
          </Text>
          <Text size="sm">
            ${onDemandUsed} / {onDemand?.limit_type === "unlimited" ? "∞" : `$${onDemandLimit}`}
          </Text>
        </Group>
        {onDemand?.limit_type !== "unlimited" && onDemandLimit > 0 && (
          <Progress value={onDemandPercent} color="green" size="sm" mb="md" />
        )}
        <Text size="sm" c="dimmed" mb="md">
          Использование по запросу списывается после достижения лимита плана и
          выставляется задним числом.
        </Text>

        <Text size="sm" fw={500} mb="xs">
          Monthly Limit
        </Text>
        <Text size="sm" c="dimmed" mb="sm">
          Установите фиксированную сумму или сделайте неограниченным.
        </Text>
        <Group align="flex-end">
          <Select
            data={[
              { value: "fixed", label: "Fixed" },
              { value: "unlimited", label: "Unlimited" },
            ]}
            value={limitType}
            onChange={(v) => setLimitType(v ?? "fixed")}
            w={140}
          />
          {limitType === "fixed" && (
            <NumberInput
              value={limitAmount}
              onChange={setLimitAmount}
              min={0}
              step={1}
              placeholder="10"
              w={100}
            />
          )}
          <Button
            onClick={handleSaveOnDemand}
            loading={savingOnDemand}
            size="sm"
            variant="light"
          >
            Save
          </Button>
        </Group>
      </Card>
    </Stack>
  );
}
