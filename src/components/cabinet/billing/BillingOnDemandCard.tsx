"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Button,
  Card,
  Group,
  Notification,
  NumberInput,
  Progress,
  Select,
  Text,
} from "@mantine/core";
import { updateOnDemandSettings, type OnDemandSettings } from "@/lib/api";

type Props = {
  initial: OnDemandSettings | null;
  /** Потрачено on-demand в текущем месяце (USD), из GET usage/. */
  onDemandUsedUsd?: string | null;
};

/** Настройка лимита on-demand USD — только на странице биллинга. */
export function BillingOnDemandCard({ initial, onDemandUsedUsd }: Props) {
  const td = useTranslations("dashboard");
  const [onDemand, setOnDemand] = useState<OnDemandSettings | null>(initial);
  const [limitType, setLimitType] = useState<string>(
    initial?.limit_type ?? "fixed",
  );
  const [limitAmount, setLimitAmount] = useState<number | string>(
    initial?.limit_amount ?? 10,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (initial) {
      setOnDemand(initial);
      setLimitType(initial.limit_type);
      setLimitAmount(initial.limit_amount ?? 10);
    }
  }, [initial]);

  const onDemandLimit =
    onDemand?.limit_type === "fixed" && onDemand?.limit_amount != null
      ? Number(onDemand.limit_amount)
      : 0;
  const usedFromApi = Number.parseFloat(String(onDemandUsedUsd ?? "0")) || 0;

  const handleSave = async () => {
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      const updated = await updateOnDemandSettings({
        limit_type: limitType as "fixed" | "unlimited",
        limit_amount: limitType === "fixed" ? Number(limitAmount) : null,
      });
      setOnDemand(updated);
      setSuccess(td("saved"));
    } catch (err) {
      setError(err instanceof Error ? err.message : td("saveError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card withBorder p="lg" radius="md" shadow="sm">
      {error && (
        <Notification color="red" onClose={() => setError("")} mb="md">
          {error}
        </Notification>
      )}
      {success && (
        <Notification color="green" onClose={() => setSuccess("")} mb="md">
          {success}
        </Notification>
      )}
      <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb="md">
        {td("onDemand")}
      </Text>
      <Group justify="space-between" mb="xs">
        <Text size="sm" fw={500}>
          {td("onDemand")}
        </Text>
        <Text size="sm">
          ${usedFromApi.toFixed(2)} /{" "}
          {onDemand?.limit_type === "unlimited" ? "∞" : `$${onDemandLimit}`}
        </Text>
      </Group>
      {onDemand?.limit_type !== "unlimited" && onDemandLimit > 0 && (
        <Progress
          value={onDemandLimit > 0 ? (usedFromApi / onDemandLimit) * 100 : 0}
          color="gray"
          size="sm"
          mb="md"
        />
      )}
      <Text size="sm" c="dimmed" mb="md">
        {td("onDemandDesc")}
      </Text>
      <Text size="sm" fw={500} mb="xs">
        {td("monthlyLimit")}
      </Text>
      <Text size="sm" c="dimmed" mb="sm">
        {td("monthlyLimitDesc")}
      </Text>
      <Group align="flex-end">
        <Select
          data={[
            { value: "fixed", label: td("fixed") },
            { value: "unlimited", label: td("unlimited") },
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
          className="btn-metallic btn-metallic-outline"
          color="silver"
          onClick={handleSave}
          loading={saving}
          size="sm"
          variant="light"
        >
          {td("save")}
        </Button>
      </Group>
    </Card>
  );
}
