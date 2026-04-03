"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  Card,
  Center,
  Group,
  Loader,
  Progress,
  Select,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  getUsageDashboard,
  type UsageDashboardPeriod,
  type UsageDashboardResponse,
} from "@/lib/api";

const PERIODS: { value: UsageDashboardPeriod; labelKey: string }[] = [
  { value: "today", labelKey: "periodToday" },
  { value: "7d", labelKey: "period7d" },
  { value: "30d", labelKey: "period30d" },
  { value: "all", labelKey: "periodAll" },
];

function formatDurationMs(ms: number | null | undefined): string {
  if (ms == null || ms < 0) return "—";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m < 60) return `${m}m ${r}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

function formatChartDate(
  dateStr: string,
  granularity: string,
  locale: string,
): string {
  try {
    const d = new Date(dateStr);
    if (granularity === "month") {
      return d.toLocaleDateString(locale, { month: "short", year: "numeric" });
    }
    return d.toLocaleDateString(locale, { month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

export default function CabinetDashboardPage() {
  const t = useTranslations("dashboard");
  const locale = useLocale();
  const [period, setPeriod] = useState<UsageDashboardPeriod>("30d");
  const [data, setData] = useState<UsageDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    getUsageDashboard(period)
      .then(setData)
      .catch(() => {
        setError(t("loadErrorUsage"));
      })
      .finally(() => setLoading(false));
  }, [period]);

  const chartData =
    data?.chart_points.map((p) => ({
      ...p,
      label: formatChartDate(p.date, data.chart_granularity, locale),
    })) ?? [];

  const hasChartActivity = chartData.some(
    (p) => p.ai_requests > 0 || p.metrics_sessions > 0,
  );

  if (loading && !data) {
    return (
      <Center py="xl">
        <Loader size="lg" />
      </Center>
    );
  }

  return (
    <Stack gap="xl">
      <Group justify="space-between" align="flex-end" wrap="wrap">
        <Title order={1}>{t("usageTitle")}</Title>
        <Select
          w={200}
          label={t("periodLabel")}
          data={PERIODS.map((p) => ({
            value: p.value,
            label: t(p.labelKey),
          }))}
          value={period}
          onChange={(v) => setPeriod((v as UsageDashboardPeriod) ?? "30d")}
        />
      </Group>

      {error && (
        <Text c="red" size="sm">
          {error}
        </Text>
      )}

      {loading && data && (
        <Center py="sm">
          <Loader size="sm" />
        </Center>
      )}

      {data && (
        <>
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
            <Card withBorder p="md" radius="md" shadow="sm">
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                {t("kpiAiRequests")}
              </Text>
              <Title order={3}>{data.kpis.ai_requests_in_period}</Title>
              <Text size="xs" c="dimmed">
                {t("kpiAiBreakdown", {
                  inc: data.kpis.ai_requests_included_in_period,
                  od: data.kpis.ai_requests_ondemand_in_period,
                })}
              </Text>
            </Card>
            <Card withBorder p="md" radius="md" shadow="sm">
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                {t("kpiMetricsSessions")}
              </Text>
              <Title order={3}>{data.kpis.metrics_sessions_in_period}</Title>
            </Card>
            <Card withBorder p="md" radius="md" shadow="sm">
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                {t("kpiMetricsDuration")}
              </Text>
              <Title order={3}>
                {formatDurationMs(data.kpis.metrics_total_duration_ms)}
              </Title>
            </Card>
            <Card withBorder p="md" radius="md" shadow="sm">
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                {t("kpiMetricsPoints")}
              </Text>
              <Title order={3}>{data.kpis.metrics_total_points}</Title>
            </Card>
            <Card withBorder p="md" radius="md" shadow="sm">
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                {t("kpiDevices")}
              </Text>
              <Title order={3}>{data.kpis.connected_devices_count}</Title>
            </Card>
            <Card withBorder p="md" radius="md" shadow="sm">
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                {t("kpiMonthlyRequests")}
              </Text>
              <Title order={3}>{data.kpis.requests_used_current_period}</Title>
              <Text size="xs" c="dimmed">
                {t("kpiTotalRequests")}: {data.kpis.total_requests_all_periods}
              </Text>
            </Card>
          </SimpleGrid>

          <Card withBorder p="lg" radius="md" shadow="sm">
            <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb="md">
              {t("progressRequests")}
            </Text>
            <Group justify="space-between" mb="xs">
              <Text size="sm" fw={500}>
                {data.limits.requests_used_current_period} /{" "}
                {data.limits.request_limit}
              </Text>
              <Text size="sm" fw={600}>
                {Math.round(data.progress.requests.percent)}%
              </Text>
            </Group>
            <Progress
              value={data.progress.requests.percent}
              color="green"
              size="lg"
              radius="xl"
              mb="lg"
            />
            <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb="md">
              {t("progressDevices")}
            </Text>
            <Group justify="space-between" mb="xs">
              <Text size="sm" fw={500}>
                {data.limits.devices_in_use} / {data.limits.device_limit}
              </Text>
              <Text size="sm" fw={600}>
                {Math.round(data.progress.devices.percent)}%
              </Text>
            </Group>
            <Progress
              value={data.progress.devices.percent}
              color="blue"
              size="md"
              radius="xl"
            />
            {data.limits.on_demand_limit_type != null && (
              <Text size="sm" c="dimmed" mt="md">
                {t("onDemandUsageLine", {
                  used: String(data.limits.on_demand_used_usd ?? "0"),
                  limit:
                    data.limits.on_demand_limit_type === "unlimited"
                      ? "∞"
                      : String(data.limits.on_demand_limit_amount_usd ?? "—"),
                })}
              </Text>
            )}
          </Card>

          <Card withBorder p="lg" radius="md" shadow="sm">
            <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb="md">
              {t("usageOverTime")}
            </Text>
            {!hasChartActivity ? (
              <Text size="sm" c="dimmed">
                {t("noChartData")}
              </Text>
            ) : (
              <div style={{ width: "100%", height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="ai_requests"
                      name={t("chartAi")}
                      stroke="#40c057"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="metrics_sessions"
                      name={t("chartMetrics")}
                      stroke="#228be6"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          <Card withBorder p="lg" radius="md" shadow="sm">
            <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb="md">
              {t("breakdownTitle")}
            </Text>
            {Object.keys(data.breakdown.diagnostic_reports_by_kind).length ===
            0 ? (
              <Text size="sm" c="dimmed">
                {t("noBreakdown")}
              </Text>
            ) : (
              <Stack gap="xs">
                {Object.entries(data.breakdown.diagnostic_reports_by_kind).map(
                  ([kind, count]) => (
                    <Group key={kind} justify="space-between">
                      <Text size="sm">{kind}</Text>
                      <Text size="sm" fw={600}>
                        {count}
                      </Text>
                    </Group>
                  ),
                )}
              </Stack>
            )}
          </Card>

          <Card withBorder p="lg" radius="md" shadow="sm">
            <Group justify="space-between" mb="md">
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                {t("recentTitle")}
              </Text>
              <Text
                component={Link}
                href="/cabinet/dashboard/analytics"
                size="sm"
                c="dimmed"
              >
                {t("openAnalytics")}
              </Text>
            </Group>
            {data.recent_activity.length === 0 ? (
              <Text size="sm" c="dimmed">
                {t("noRecent")}
              </Text>
            ) : (
              <Stack gap="sm">
                {data.recent_activity.map((row, idx) => (
                  <Card
                    key={`${row.external_id ?? idx}-${row.created_at ?? ""}`}
                    withBorder
                    p="sm"
                    radius="sm"
                  >
                    <Text size="sm" fw={500}>
                      {row.vehicle_name_meta || row.external_id || "—"}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {row.created_at
                        ? new Date(row.created_at).toLocaleString(locale)
                        : "—"}{" "}
                      · {formatDurationMs(row.duration_ms)} ·{" "}
                      {t("pointsLabel", { n: row.points_count ?? 0 })}
                    </Text>
                  </Card>
                ))}
              </Stack>
            )}
          </Card>
        </>
      )}
    </Stack>
  );
}
