"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Badge,
  Button,
  Card,
  Center,
  Code,
  Group,
  Loader,
  MultiSelect,
  ScrollArea,
  Stack,
  Tabs,
  Text,
  Textarea,
  Title,
  UnstyledButton,
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

  if (recordsLoading) {
    return (
      <Center py="xl">
        <Loader size="lg" />
      </Center>
    );
  }

  return (
    <Stack gap="md">
      <Title order={1}>{t("title")}</Title>
      <Text c="dimmed" size="sm">
        {t("subtitle")}
      </Text>

      {recordsError && (
        <Text c="red" size="sm">
          {recordsError}
        </Text>
      )}

      <Group align="flex-start" wrap="nowrap" gap="md" style={{ minHeight: 480 }}>
        <Card withBorder p="sm" w={300} miw={260} mih={400}>
          <Text fw={600} size="sm" mb="xs">
            {t("records")}
          </Text>
          {records.length === 0 ? (
            <Text size="sm" c="dimmed">
              {t("noRecords")}
            </Text>
          ) : (
            <ScrollArea h={420}>
              <Stack gap={4}>
                {records.map((r) => {
                  const active = r.external_id === selectedId;
                  return (
                    <UnstyledButton
                      key={r.external_id}
                      onClick={() => setSelectedId(r.external_id)}
                      p="xs"
                      style={{
                        borderRadius: 8,
                        background: active ? "var(--mantine-color-blue-light)" : undefined,
                      }}
                    >
                      <Text size="sm" fw={active ? 600 : 400} lineClamp={2}>
                        {formatWhen(r.started_at, locale)}
                      </Text>
                      <Text size="xs" c="dimmed" lineClamp={1}>
                        {r.vehicle
                          ? `${r.vehicle.make} ${r.vehicle.model}`
                          : r.vehicle_name_meta || "—"}
                      </Text>
                      <Group gap={6} mt={4}>
                        <Badge size="xs" variant="light">
                          {r.points_count} pts
                        </Badge>
                        {r.errors_survey_kind ? (
                          <Badge size="xs" color="orange" variant="light">
                            DTC
                          </Badge>
                        ) : null}
                      </Group>
                    </UnstyledButton>
                  );
                })}
              </Stack>
            </ScrollArea>
          )}
        </Card>

        <Stack gap="sm" style={{ flex: 1, minWidth: 0 }}>
          {!selectedId && (
            <Text c="dimmed" size="sm">
              {t("selectRecord")}
            </Text>
          )}

          {selectedId && detailLoading && (
            <Center py="md">
              <Loader />
            </Center>
          )}

          {detailError && (
            <Text c="red" size="sm">
              {detailError}
            </Text>
          )}

          {selectedId && !detailLoading && selectedRecord && (
            <Tabs defaultValue="overview">
              <Tabs.List>
                <Tabs.Tab value="overview">{t("tabOverview")}</Tabs.Tab>
                <Tabs.Tab value="errors">{t("tabErrors")}</Tabs.Tab>
                <Tabs.Tab value="charts">{t("tabCharts")}</Tabs.Tab>
                <Tabs.Tab value="chat">{t("tabChat")}</Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="overview" pt="md">
                <Stack gap="sm">
                  <Group>
                    <Text size="sm" fw={600}>
                      {t("externalId")}:
                    </Text>
                    <Code>{selectedRecord.external_id}</Code>
                  </Group>
                  <Text size="sm">
                    <strong>{t("started")}:</strong> {formatWhen(selectedRecord.started_at, locale)}
                  </Text>
                  <Text size="sm">
                    <strong>{t("vehicle")}:</strong>{" "}
                    {selectedRecord.vehicle
                      ? `${selectedRecord.vehicle.make} ${selectedRecord.vehicle.model}`
                      : selectedRecord.vehicle_name_meta || "—"}
                  </Text>
                  <Text size="sm">
                    <strong>{t("points")}:</strong> {selectedRecord.points_count}
                  </Text>
                  {summary && (
                    <Code block style={{ whiteSpace: "pre-wrap", fontSize: 12 }}>
                      {summary.text_summary}
                    </Code>
                  )}
                  {summary?.anomalies.length ? (
                    <Card withBorder p="sm" bg="var(--mantine-color-red-light)">
                      <Text size="sm" fw={600} mb={4}>
                        {t("anomalies")}
                      </Text>
                      {summary.anomalies.map((a) => (
                        <Text key={a} size="sm">
                          • {a}
                        </Text>
                      ))}
                    </Card>
                  ) : null}
                </Stack>
              </Tabs.Panel>

              <Tabs.Panel value="errors" pt="md">
                {recordDetail?.errors_survey_kind ||
                recordDetail?.errors_captured_at ||
                recordDetail?.errors_snapshot ? (
                  <Stack gap="xs">
                    <Text size="sm">
                      {t("surveyKind")}: {recordDetail?.errors_survey_kind || "—"}
                    </Text>
                    <Text size="sm">
                      {t("surveyAt")}:{" "}
                      {recordDetail?.errors_captured_at
                        ? formatWhen(recordDetail.errors_captured_at, locale)
                        : "—"}
                    </Text>
                    {recordDetail?.errors_snapshot ? (
                      <Code block style={{ whiteSpace: "pre-wrap", fontSize: 11 }}>
                        {JSON.stringify(recordDetail.errors_snapshot, null, 2)}
                      </Code>
                    ) : (
                      <Text size="sm" c="dimmed">
                        {t("noErrors")}
                      </Text>
                    )}
                  </Stack>
                ) : (
                  <Text size="sm" c="dimmed">
                    {t("noErrors")}
                  </Text>
                )}
              </Tabs.Panel>

              <Tabs.Panel value="charts" pt="md">
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
                    <Text size="sm" c="dimmed">
                      {t("noChartData")}
                    </Text>
                  ) : (
                    <div style={{ width: "100%", height: 360 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="t"
                            type="number"
                            domain={["dataMin", "dataMax"]}
                            tickFormatter={(v) => String(v)}
                          />
                          <YAxis />
                          <Tooltip />
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
                  )}
                </Stack>
              </Tabs.Panel>

              <Tabs.Panel value="chat" pt="md">
                <Stack gap="sm">
                  {!chatSessionId ? (
                    <Button
                      onClick={() => void handleOpenChat()}
                      loading={chatBootstrapping}
                      variant="light"
                    >
                      {t("startChat")}
                    </Button>
                  ) : (
                    <>
                      <ScrollArea h={280}>
                        <Stack gap="xs">
                          {chatMessages.map((m) => (
                            <Card
                              key={m.id}
                              withBorder
                              p="xs"
                              bg={
                                m.role === "user"
                                  ? "var(--mantine-color-gray-light)"
                                  : "var(--mantine-color-blue-light)"
                              }
                            >
                              <Text size="xs" c="dimmed" mb={4}>
                                {m.role} · {formatWhen(m.created_at, locale)}
                              </Text>
                              <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
                                {m.content}
                              </Text>
                            </Card>
                          ))}
                        </Stack>
                      </ScrollArea>
                      <Textarea
                        label={t("yourMessage")}
                        minRows={3}
                        value={chatInput}
                        onChange={(e) => setChatInput(e.currentTarget.value)}
                      />
                      <Button onClick={() => void handleSendChat()} loading={chatLoading}>
                        {t("send")}
                      </Button>
                    </>
                  )}
                </Stack>
              </Tabs.Panel>
            </Tabs>
          )}
        </Stack>
      </Group>
    </Stack>
  );
}
