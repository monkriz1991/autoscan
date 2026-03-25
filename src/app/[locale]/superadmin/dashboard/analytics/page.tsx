"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Alert,
  Badge,
  Box,
  Button,
  Card,
  Center,
  Code,
  Divider,
  Group,
  Loader,
  MultiSelect,
  Paper,
  ScrollArea,
  SimpleGrid,
  Stack,
  Tabs,
  Text,
  Textarea,
  ThemeIcon,
  Title,
  UnstyledButton,
} from "@mantine/core";
import {
  IconAlertTriangle,
  IconChartLine,
  IconChevronRight,
  IconCloudUpload,
  IconLayoutDashboard,
  IconMessageCircle,
  IconRoad,
  IconRulerMeasure,
  IconStack2,
} from "@tabler/icons-react";
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
  ApiError,
  bootstrapObdRecordChat,
  getDiagnosticChatSession,
  getObdRecordDetail,
  getObdRecordSegment,
  getObdRecordSummary,
  getObdRecordsPage,
  sendDiagnosticChatMessage,
  type DiagnosticChatMessage,
  type OBDRecordDetail,
  type OBDRecordListItem,
  type OBDRecordSegment,
  type OBDRecordSummary,
} from "@/lib/api";

const CHART_COLORS = ["#228be6", "#40c057", "#fd7e14", "#ae3ec9", "#fab005"];

function formatWhen(iso: string, locale: string): string {
  try {
    return new Date(iso).toLocaleString(locale);
  } catch {
    return iso;
  }
}

function formatDurationMs(ms: number | null | undefined): string {
  if (ms == null || ms < 0) return "—";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}m ${r}s`;
}

function mergeSegmentRows(
  segment: OBDRecordSegment | null,
  fieldKeys: string[],
): Array<Record<string, number>> {
  if (!segment) return [];
  const byTs = new Map<number, Record<string, number>>();
  for (const p of segment.points) {
    const row: Record<string, number> = { t: p.timestamp };
    for (const k of fieldKeys) {
      const raw = p.values[k];
      if (typeof raw === "number" && Number.isFinite(raw)) {
        row[k] = raw;
      } else if (typeof raw === "string") {
        const n = Number(raw);
        if (Number.isFinite(n)) row[k] = n;
      }
    }
    byTs.set(p.timestamp, { ...byTs.get(p.timestamp), ...row });
  }
  return Array.from(byTs.values()).sort((a, b) => a.t - b.t);
}

export default function AnalyticsPage() {
  const t = useTranslations("analytics");
  const locale =
    typeof navigator !== "undefined" ? navigator.language || "ru-RU" : "ru-RU";

  const [records, setRecords] = useState<OBDRecordListItem[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(true);
  const [recordsError, setRecordsError] = useState("");

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [recordDetail, setRecordDetail] = useState<OBDRecordDetail | null>(null);
  const [summary, setSummary] = useState<OBDRecordSummary | null>(null);
  const [segment, setSegment] = useState<OBDRecordSegment | null>(null);
  const [chartFields, setChartFields] = useState<string[]>([]);

  const [chatSessionId, setChatSessionId] = useState<number | null>(null);
  const [chatMessages, setChatMessages] = useState<DiagnosticChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatBootstrapping, setChatBootstrapping] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setRecordsLoading(true);
      setRecordsError("");
      try {
        const page = await getObdRecordsPage(1, 50);
        if (cancelled) return;
        setRecords(page.results);
        setSelectedId((prev) => prev ?? page.results[0]?.external_id ?? null);
      } catch (e) {
        if (!cancelled) {
          setRecordsError(e instanceof Error ? e.message : t("loadError"));
        }
      } finally {
        if (!cancelled) setRecordsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [t]);

  useEffect(() => {
    if (!selectedId) {
      setSummary(null);
      setSegment(null);
      setChartFields([]);
      setChatSessionId(null);
      setChatMessages([]);
      return;
    }
    let cancelled = false;
    setDetailLoading(true);
    setDetailError("");
    setSummary(null);
    setRecordDetail(null);
    setSegment(null);
    setChatSessionId(null);
    setChatMessages([]);

    (async () => {
      try {
        const sum = await getObdRecordSummary(selectedId);
        if (cancelled) return;
        setSummary(sum);
        try {
          const det = await getObdRecordDetail(selectedId);
          if (!cancelled) setRecordDetail(det);
        } catch {
          if (!cancelled) setRecordDetail(null);
        }
        const numericPids = sum.pids.filter((pid) => {
          const st = sum.stats[pid];
          return st && st.samples > 0;
        });
        const pick = numericPids.slice(0, 3);
        setChartFields(pick);

        const fromMs = sum.time_from_ms ?? 0;
        const toMs = sum.time_to_ms ?? fromMs;
        if (sum.points_total > 0 && toMs >= fromMs) {
          const seg = await getObdRecordSegment(selectedId, fromMs, toMs, pick.length ? pick : undefined);
          if (!cancelled) setSegment(seg);
        }
      } catch (e) {
        if (!cancelled) {
          setDetailError(e instanceof Error ? e.message : t("detailError"));
        }
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedId, t]);

  const chartData = useMemo(
    () => mergeSegmentRows(segment, chartFields),
    [segment, chartFields],
  );

  const chartFieldOptions = useMemo(() => {
    if (!summary) return [];
    return summary.pids.map((p) => ({
      value: p,
      label: `${p}${summary.stats[p]?.samples ? ` (n=${summary.stats[p].samples})` : ""}`,
    }));
  }, [summary]);

  const refreshChat = useCallback(async (sid: number) => {
    const s = await getDiagnosticChatSession(sid);
    setChatMessages(s.messages);
  }, []);

  const handleOpenChat = useCallback(async () => {
    if (!selectedId) return;
    setChatBootstrapping(true);
    try {
      const boot = await bootstrapObdRecordChat(selectedId);
      setChatSessionId(boot.chat_session_id);
      await refreshChat(boot.chat_session_id);
    } catch (e) {
      const msg =
        e instanceof ApiError && typeof e.data === "object" && e.data && "detail" in e.data
          ? String((e.data as { detail?: unknown }).detail)
          : e instanceof Error
            ? e.message
            : t("chatError");
      setDetailError(msg);
    } finally {
      setChatBootstrapping(false);
    }
  }, [selectedId, refreshChat, t]);

  const handleSendChat = useCallback(async () => {
    const text = chatInput.trim();
    if (!text || !chatSessionId) return;
    setChatLoading(true);
    setChatInput("");
    try {
      await sendDiagnosticChatMessage(chatSessionId, text);
      await refreshChat(chatSessionId);
    } catch (e) {
      const msg =
        e instanceof ApiError && typeof e.data === "object" && e.data && "detail" in e.data
          ? String((e.data as { detail?: unknown }).detail)
          : e instanceof Error
            ? e.message
            : t("chatError");
      setDetailError(msg);
    } finally {
      setChatLoading(false);
    }
  }, [chatInput, chatSessionId, refreshChat, t]);

  const selectedRecord = records.find((r) => r.external_id === selectedId);

  const hasErrorSnapshot =
    !!selectedRecord?.errors_survey_kind || !!recordDetail?.errors_snapshot;

  if (recordsLoading) {
    return (
      <Center py="xl">
        <Stack align="center" gap="md">
          <Loader size="lg" color="blue" />
          <Text c="dimmed" size="sm">
            {t("loadingDetail")}
          </Text>
        </Stack>
      </Center>
    );
  }

  return (
    <Stack gap="lg">
      <Paper
        radius="lg"
        p="xl"
        shadow="sm"
        style={{
          position: "relative",
          overflow: "hidden",
          background: "linear-gradient(145deg, #f8fafc 0%, #ffffff 45%, #f1f5f9 100%)",
          border: "1px solid rgba(148, 163, 184, 0.25)",
        }}
      >
        <Box
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 5,
            background: "linear-gradient(180deg, #228be6 0%, #4dabf7 50%, #74c0fc 100%)",
            borderRadius: "4px 0 0 4px",
          }}
        />
        <Stack gap="xs" style={{ paddingLeft: 12 }}>
          <Group gap="sm">
            <ThemeIcon size="lg" radius="md" variant="gradient" gradient={{ from: "blue.6", to: "cyan.5" }}>
              <IconChartLine size={22} stroke={1.5} />
            </ThemeIcon>
            <div>
              <Title order={2} fw={700} style={{ letterSpacing: "-0.02em" }}>
                {t("title")}
              </Title>
              <Text c="dimmed" size="sm" maw={640} mt={4}>
                {t("subtitle")}
              </Text>
            </div>
          </Group>
        </Stack>
      </Paper>

      {recordsError ? (
        <Alert color="red" variant="light" title={t("loadError")} icon={<IconAlertTriangle size={18} />}>
          {recordsError}
        </Alert>
      ) : null}

      <Group align="stretch" wrap="nowrap" gap="lg" style={{ minHeight: 520 }}>
        {/* Список записей */}
        <Paper
          radius="lg"
          p={0}
          shadow="md"
          withBorder
          w={320}
          miw={280}
          style={{
            display: "flex",
            flexDirection: "column",
            borderColor: "rgba(148, 163, 184, 0.35)",
            background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
          }}
        >
          <Box px="md" py="sm" style={{ borderBottom: "1px solid var(--mantine-color-gray-3)" }}>
            <Group justify="space-between" wrap="nowrap">
              <Text fw={700} size="sm" c="dark.7">
                {t("records")}
              </Text>
              <Badge size="sm" variant="light" color="gray">
                {t("recordsCount", { count: records.length })}
              </Badge>
            </Group>
          </Box>

          <Box p="md" style={{ flex: 1, minHeight: 0 }}>
            {records.length === 0 ? (
              <Stack align="center" gap="md" py="xl" px="sm">
                <ThemeIcon size={72} radius="xl" variant="light" color="gray">
                  <IconCloudUpload size={36} stroke={1.25} />
                </ThemeIcon>
                <Text ta="center" fw={600} size="md">
                  {t("noRecords")}
                </Text>
                <Text ta="center" size="sm" c="dimmed" lh={1.6}>
                  {t("noRecordsHint")}
                </Text>
              </Stack>
            ) : (
              <ScrollArea h={440} type="auto" offsetScrollbars>
                <Stack gap={8}>
                  {records.map((r) => {
                    const active = r.external_id === selectedId;
                    return (
                      <UnstyledButton
                        key={r.external_id}
                        onClick={() => setSelectedId(r.external_id)}
                        style={{ width: "100%" }}
                      >
                        <Paper
                          radius="md"
                          p="sm"
                          withBorder
                          style={{
                            borderColor: active ? "var(--mantine-color-blue-4)" : "var(--mantine-color-gray-3)",
                            background: active
                              ? "linear-gradient(135deg, rgba(34, 139, 230, 0.08) 0%, rgba(255,255,255,0.95) 100%)"
                              : "var(--mantine-color-body)",
                            boxShadow: active ? "0 4px 14px rgba(34, 139, 230, 0.12)" : "0 1px 2px rgba(0,0,0,0.04)",
                            transition: "box-shadow 0.15s ease, border-color 0.15s ease, transform 0.15s ease",
                          }}
                          className="analytics-record-row"
                        >
                          <Group justify="space-between" wrap="nowrap" gap={8}>
                            <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
                              <Text size="sm" fw={active ? 700 : 500} lineClamp={1}>
                                {formatWhen(r.started_at, locale)}
                              </Text>
                              <Group gap={6} wrap="nowrap">
                                <IconRoad size={14} style={{ opacity: 0.45, flexShrink: 0 }} />
                                <Text size="xs" c="dimmed" lineClamp={1}>
                                  {r.vehicle
                                    ? `${r.vehicle.make} ${r.vehicle.model}`
                                    : r.vehicle_name_meta || "—"}
                                </Text>
                              </Group>
                              <Group gap={6} mt={2}>
                                <Badge size="xs" variant="dot" color="blue">
                                  {r.points_count} pts
                                </Badge>
                                {r.errors_survey_kind ? (
                                  <Badge size="xs" variant="dot" color="orange">
                                    DTC
                                  </Badge>
                                ) : null}
                              </Group>
                            </Stack>
                            <IconChevronRight
                              size={18}
                              style={{
                                opacity: active ? 1 : 0.25,
                                color: "var(--mantine-color-blue-6)",
                                flexShrink: 0,
                              }}
                            />
                          </Group>
                        </Paper>
                      </UnstyledButton>
                    );
                  })}
                </Stack>
              </ScrollArea>
            )}
          </Box>
        </Paper>

        {/* Правая панель */}
        <Paper
          radius="lg"
          p={0}
          shadow="md"
          withBorder
          style={{
            flex: 1,
            minWidth: 0,
            borderColor: "rgba(148, 163, 184, 0.35)",
            background: "#ffffff",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {!selectedId ? (
            <Center flex={1} p="xl" style={{ minHeight: 400 }}>
              <Stack align="center" gap="lg" maw={400}>
                <ThemeIcon size={80} radius="xl" variant="light" color="blue">
                  <IconLayoutDashboard size={40} stroke={1.2} />
                </ThemeIcon>
                <div style={{ textAlign: "center" }}>
                  <Title order={4} mb="xs">
                    {t("emptyDetailTitle")}
                  </Title>
                  <Text c="dimmed" size="sm" lh={1.65}>
                    {t("emptyDetailHint")}
                  </Text>
                </div>
              </Stack>
            </Center>
          ) : detailLoading ? (
            <Center flex={1} py="xl">
              <Stack align="center" gap="md">
                <Loader size="md" />
                <Text c="dimmed" size="sm">
                  {t("loadingDetail")}
                </Text>
              </Stack>
            </Center>
          ) : selectedRecord ? (
            <>
              {detailError ? (
                <Alert m="md" color="red" variant="light">
                  {detailError}
                </Alert>
              ) : null}

              <Box px="lg" pt="md" pb="xs">
                <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
                  <div>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb={4}>
                      {t("started")}
                    </Text>
                    <Title order={4} fw={700}>
                      {formatWhen(selectedRecord.started_at, locale)}
                    </Title>
                    <Text size="xs" c="dimmed" mt={6} style={{ fontFamily: "var(--mantine-font-family-monospace)" }}>
                      {selectedRecord.external_id}
                    </Text>
                  </div>
                  <Badge size="lg" variant="light" color="blue" radius="md">
                    {selectedRecord.points_count} pts
                  </Badge>
                </Group>

                <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm" mt="lg">
                  <Card padding="sm" radius="md" withBorder bg="gray.0">
                    <Group gap="xs" wrap="nowrap">
                      <ThemeIcon size="sm" variant="light" color="blue">
                        <IconStack2 size={14} />
                      </ThemeIcon>
                      <div>
                        <Text size="xs" c="dimmed">
                          {t("statPoints")}
                        </Text>
                        <Text fw={700} size="lg">
                          {selectedRecord.points_count}
                        </Text>
                      </div>
                    </Group>
                  </Card>
                  <Card padding="sm" radius="md" withBorder bg="gray.0">
                    <Group gap="xs" wrap="nowrap">
                      <ThemeIcon size="sm" variant="light" color="teal">
                        <IconRulerMeasure size={14} />
                      </ThemeIcon>
                      <div>
                        <Text size="xs" c="dimmed">
                          {t("statPids")}
                        </Text>
                        <Text fw={700} size="lg">
                          {selectedRecord.pids.length}
                        </Text>
                      </div>
                    </Group>
                  </Card>
                  <Card padding="sm" radius="md" withBorder bg="gray.0">
                    <Group gap="xs" wrap="nowrap">
                      <ThemeIcon size="sm" variant="light" color="grape">
                        <IconChartLine size={14} />
                      </ThemeIcon>
                      <div>
                        <Text size="xs" c="dimmed">
                          {t("statDuration")}
                        </Text>
                        <Text fw={700} size="lg">
                          {formatDurationMs(selectedRecord.duration_ms)}
                        </Text>
                      </div>
                    </Group>
                  </Card>
                  <Card padding="sm" radius="md" withBorder bg="gray.0">
                    <Group gap="xs" wrap="nowrap">
                      <ThemeIcon size="sm" variant="light" color={hasErrorSnapshot ? "orange" : "gray"}>
                        <IconAlertTriangle size={14} />
                      </ThemeIcon>
                      <div>
                        <Text size="xs" c="dimmed">
                          {t("statErrors")}
                        </Text>
                        <Text fw={700} size="lg">
                          {hasErrorSnapshot ? t("statErrorsYes") : t("statErrorsNo")}
                        </Text>
                      </div>
                    </Group>
                  </Card>
                </SimpleGrid>
              </Box>

              <Divider />

              <Tabs
                defaultValue="overview"
                px="md"
                pt="sm"
                pb="md"
                variant="pills"
                radius="md"
                keepMounted={false}
              >
                <Tabs.List grow mb="md" style={{ flexWrap: "wrap" }}>
                  <Tabs.Tab value="overview" leftSection={<IconLayoutDashboard size={16} />}>
                    {t("tabOverview")}
                  </Tabs.Tab>
                  <Tabs.Tab value="errors" leftSection={<IconAlertTriangle size={16} />}>
                    {t("tabErrors")}
                  </Tabs.Tab>
                  <Tabs.Tab value="charts" leftSection={<IconChartLine size={16} />}>
                    {t("tabCharts")}
                  </Tabs.Tab>
                  <Tabs.Tab value="chat" leftSection={<IconMessageCircle size={16} />}>
                    {t("tabChat")}
                  </Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="overview" pt="xs">
                  <Stack gap="md">
                    <Text size="xs" fw={600} c="dimmed" tt="uppercase">
                      {t("statsTitle")}
                    </Text>
                    <Group>
                      <Text size="sm" w={120} c="dimmed">
                        {t("vehicle")}
                      </Text>
                      <Text size="sm" fw={500}>
                        {selectedRecord.vehicle
                          ? `${selectedRecord.vehicle.make} ${selectedRecord.vehicle.model}`
                          : selectedRecord.vehicle_name_meta || "—"}
                      </Text>
                    </Group>
                    {summary ? (
                      <>
                        <Text size="xs" fw={600} c="dimmed" tt="uppercase">
                          {t("summaryBlock")}
                        </Text>
                        <Paper p="md" radius="md" withBorder bg="gray.0">
                          <Code block style={{ whiteSpace: "pre-wrap", fontSize: 12, background: "transparent" }}>
                            {summary.text_summary}
                          </Code>
                        </Paper>
                      </>
                    ) : null}
                    {summary?.anomalies.length ? (
                      <Paper p="md" radius="md" withBorder bg="red.0" style={{ borderColor: "var(--mantine-color-red-3)" }}>
                        <Text size="sm" fw={700} mb="xs" c="red.8">
                          {t("anomalies")}
                        </Text>
                        <Stack gap={6}>
                          {summary.anomalies.map((a) => (
                            <Text key={a} size="sm" c="red.9">
                              • {a}
                            </Text>
                          ))}
                        </Stack>
                      </Paper>
                    ) : null}
                  </Stack>
                </Tabs.Panel>

                <Tabs.Panel value="errors" pt="xs">
                  {recordDetail?.errors_survey_kind ||
                  recordDetail?.errors_captured_at ||
                  recordDetail?.errors_snapshot ? (
                    <Stack gap="md">
                      <Group gap="xl">
                        <div>
                          <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                            {t("surveyKind")}
                          </Text>
                          <Text size="sm" fw={500}>
                            {recordDetail?.errors_survey_kind || "—"}
                          </Text>
                        </div>
                        <div>
                          <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                            {t("surveyAt")}
                          </Text>
                          <Text size="sm" fw={500}>
                            {recordDetail?.errors_captured_at
                              ? formatWhen(recordDetail.errors_captured_at, locale)
                              : "—"}
                          </Text>
                        </div>
                      </Group>
                      {recordDetail?.errors_snapshot ? (
                        <Paper p="md" radius="md" withBorder>
                          <Code block style={{ whiteSpace: "pre-wrap", fontSize: 11 }}>
                            {JSON.stringify(recordDetail.errors_snapshot, null, 2)}
                          </Code>
                        </Paper>
                      ) : (
                        <Text size="sm" c="dimmed">
                          {t("noErrors")}
                        </Text>
                      )}
                    </Stack>
                  ) : (
                    <Paper p="xl" radius="md" withBorder bg="gray.0">
                      <Text size="sm" c="dimmed" ta="center">
                        {t("noErrors")}
                      </Text>
                    </Paper>
                  )}
                </Tabs.Panel>

                <Tabs.Panel value="charts" pt="xs">
                  <Stack gap="md">
                    <MultiSelect
                      label={t("chartFields")}
                      data={chartFieldOptions}
                      value={chartFields}
                      onChange={async (vals) => {
                        setChartFields(vals);
                        if (!selectedId || !summary) return;
                        const fromMs = summary.time_from_ms ?? 0;
                        const toMs = summary.time_to_ms ?? fromMs;
                        if (toMs < fromMs) return;
                        try {
                          const seg = await getObdRecordSegment(
                            selectedId,
                            fromMs,
                            toMs,
                            vals.length ? vals : undefined,
                          );
                          setSegment(seg);
                        } catch {
                          /* ignore */
                        }
                      }}
                      searchable
                      clearable
                    />
                    {chartData.length === 0 || chartFields.length === 0 ? (
                      <Paper p="xl" radius="md" withBorder bg="gray.0">
                        <Text size="sm" c="dimmed" ta="center">
                          {t("noChartData")}
                        </Text>
                      </Paper>
                    ) : (
                      <Paper p="lg" radius="md" withBorder shadow="xs">
                        <Text fw={600} size="sm" mb="md">
                          {t("chartCardTitle")}
                        </Text>
                        <div style={{ width: "100%", height: 380 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 8, right: 16, left: 4, bottom: 8 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                              <XAxis
                                dataKey="t"
                                type="number"
                                domain={["dataMin", "dataMax"]}
                                tickFormatter={(v) => String(v)}
                                stroke="#94a3b8"
                                fontSize={11}
                              />
                              <YAxis stroke="#94a3b8" fontSize={11} />
                              <Tooltip
                                contentStyle={{
                                  borderRadius: 8,
                                  border: "1px solid #e2e8f0",
                                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                                }}
                              />
                              <Legend />
                              {chartFields.map((f, i) => (
                                <Line
                                  key={f}
                                  type="monotone"
                                  dataKey={f}
                                  stroke={CHART_COLORS[i % CHART_COLORS.length]}
                                  dot={false}
                                  strokeWidth={2}
                                  connectNulls
                                />
                              ))}
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </Paper>
                    )}
                  </Stack>
                </Tabs.Panel>

                <Tabs.Panel value="chat" pt="xs">
                  <Stack gap="md">
                    <Text size="sm" c="dimmed">
                      {t("chatIntro")}
                    </Text>
                    {!chatSessionId ? (
                      <Button
                        className="btn-metallic btn-metallic-outline"
                        color="silver"
                        leftSection={<IconMessageCircle size={18} />}
                        onClick={() => void handleOpenChat()}
                        loading={chatBootstrapping}
                        variant="light"
                        size="md"
                      >
                        {t("startChat")}
                      </Button>
                    ) : (
                      <>
                        <Paper
                          withBorder
                          radius="md"
                          p="sm"
                          style={{
                            background: "linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)",
                            maxHeight: 320,
                          }}
                        >
                          <ScrollArea h={300} type="auto">
                            <Stack gap="sm" pr={4}>
                              {chatMessages.map((m) => {
                                const isUser = m.role === "user";
                                return (
                                  <Box
                                    key={m.id}
                                    style={{
                                      display: "flex",
                                      justifyContent: isUser ? "flex-end" : "flex-start",
                                    }}
                                  >
                                    <Paper
                                      radius="lg"
                                      p="sm"
                                      maw="85%"
                                      shadow="xs"
                                      style={{
                                        background: isUser
                                          ? "linear-gradient(135deg, #e7f5ff 0%, #d0ebff 100%)"
                                          : "linear-gradient(135deg, #f1f3f5 0%, #ffffff 100%)",
                                        border: `1px solid ${
                                          isUser ? "rgba(34, 139, 230, 0.25)" : "rgba(148, 163, 184, 0.35)"
                                        }`,
                                      }}
                                    >
                                      <Text size="xs" c="dimmed" mb={6}>
                                        {isUser ? t("userLabel") : t("assistantLabel")} ·{" "}
                                        {formatWhen(m.created_at, locale)}
                                      </Text>
                                      <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
                                        {m.content}
                                      </Text>
                                    </Paper>
                                  </Box>
                                );
                              })}
                            </Stack>
                          </ScrollArea>
                        </Paper>
                        <Textarea
                          label={t("yourMessage")}
                          minRows={3}
                          radius="md"
                          value={chatInput}
                          onChange={(e) => setChatInput(e.currentTarget.value)}
                        />
                        <Group justify="flex-end">
                          <Button
                            className="btn-metallic btn-metallic-outline"
                            color="silver"
                            onClick={() => void handleSendChat()}
                            loading={chatLoading}
                            size="sm"
                          >
                            {t("send")}
                          </Button>
                        </Group>
                      </>
                    )}
                  </Stack>
                </Tabs.Panel>
              </Tabs>
            </>
          ) : (
            <Center flex={1}>
              <Text c="dimmed" size="sm">
                {t("selectRecord")}
              </Text>
            </Center>
          )}
        </Paper>
      </Group>
    </Stack>
  );
}
