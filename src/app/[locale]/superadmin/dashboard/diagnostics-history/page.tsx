"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  Card,
  Title,
  Text,
  Stack,
  Group,
  Loader,
  Center,
  Button,
  ScrollArea,
  Box,
  Badge,
  Flex,
  UnstyledButton,
  TextInput,
} from "@mantine/core";
import { IconMessageCircle, IconRefresh, IconSearch } from "@tabler/icons-react";
import {
  getDiagnosticChatSession,
  getDiagnosticChatSessions,
  getDiagnosticHistory,
  getDiagnosticReport,
  isAuthenticated,
  type DiagnosticChatSessionDetail,
  type DiagnosticReportDetail,
} from "@/lib/api";
import { formatUserRequestFull } from "@/lib/diagnostic-report-format";
import {
  isHistoryDebugMode,
  sanitizeLiveDataSnapshotForHistory,
} from "@/lib/snapshot-display";

function formatDate(iso: string, locale: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString(locale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

const HISTORY_PAGE_SIZE = 50;

type HistoryThread =
  | {
      kind: "report";
      sortKey: number;
      detail: DiagnosticReportDetail;
    }
  | {
      kind: "chat";
      sortKey: number;
      detail: DiagnosticChatSessionDetail;
    };

function threadKey(th: HistoryThread): string {
  return th.kind === "report" ? `report-${th.detail.id}` : `chat-${th.detail.id}`;
}

function threadTabSubtitle(th: HistoryThread): string {
  if (th.kind === "chat") {
    const msgs = th.detail.messages;
    const last = msgs.length ? msgs[msgs.length - 1] : null;
    const raw = (last?.content ?? "—").replace(/\s+/g, " ").trim();
    return raw.length > 56 ? `${raw.slice(0, 56)}…` : raw;
  }
  const d = th.detail;
  if (d.dtc_codes?.length) return d.dtc_codes.slice(0, 3).join(", ");
  return "Live data";
}

function buildThreadHaystack(
  th: HistoryThread,
  locale: string,
  historyDbg: boolean,
): string {
  if (th.kind === "report") {
    const d = th.detail;
    const v = d.vehicle;
    return [
      String(d.id),
      d.report_kind,
      d.created_at,
      formatDate(d.created_at, locale),
      ...(d.dtc_codes ?? []),
      d.ai_analysis ?? "",
      formatUserRequestFull(d, historyDbg),
      v ? `${v.make} ${v.model}` : "",
      v?.year != null ? String(v.year) : "",
    ]
      .join(" ")
      .toLowerCase();
  }
  const d = th.detail;
  return [
    String(d.id),
    d.title ?? "",
    d.created_at,
    d.updated_at,
    formatDate(d.updated_at, locale),
    formatDate(d.created_at, locale),
    ...d.messages.map((m) => m.content),
  ]
    .join(" ")
    .toLowerCase();
}

function threadMatchesQuery(
  th: HistoryThread,
  raw: string,
  locale: string,
  historyDbg: boolean,
): boolean {
  const q = raw.trim().toLowerCase().replace(/\s+/g, " ");
  if (!q) return true;
  const hay = buildThreadHaystack(th, locale, historyDbg);
  const tokens = q.split(/\s+/).filter(Boolean);
  return tokens.every((tok) => hay.includes(tok));
}

export default function DiagnosticsHistoryPage() {
  const t = useTranslations("diagnosticsHistory");
  const locale = useLocale();
  const router = useRouter();
  const historyDbg = isHistoryDebugMode();
  const [threads, setThreads] = useState<HistoryThread[]>([]);
  const [reportTotal, setReportTotal] = useState(0);
  const [chatTotal, setChatTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const mainScrollRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const [histRes, chatListRes] = await Promise.all([
        getDiagnosticHistory(1, HISTORY_PAGE_SIZE),
        getDiagnosticChatSessions(1, HISTORY_PAGE_SIZE),
      ]);
      setReportTotal(histRes.count);
      setChatTotal(chatListRes.count);

      const [reportSettled, chatSettled] = await Promise.all([
        Promise.allSettled(
          histRes.results.map((row) => getDiagnosticReport(row.id)),
        ),
        Promise.allSettled(
          chatListRes.results.map((row) => getDiagnosticChatSession(row.id)),
        ),
      ]);

      const merged: HistoryThread[] = [];
      for (const s of reportSettled) {
        if (s.status !== "fulfilled") continue;
        const detail = s.value;
        merged.push({
          kind: "report",
          sortKey: new Date(detail.created_at).getTime(),
          detail,
        });
      }
      for (const s of chatSettled) {
        if (s.status !== "fulfilled") continue;
        const detail = s.value;
        merged.push({
          kind: "chat",
          sortKey: new Date(detail.updated_at).getTime(),
          detail,
        });
      }
      merged.sort((a, b) => a.sortKey - b.sortKey);
      setThreads(merged);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("loadError"));
      setThreads([]);
    } finally {
      setLoading(false);
    }
  }, [router, t]);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }
    void load();
  }, [load, router]);

  const filteredSidebar = useMemo(() => {
    const rev = [...threads].reverse();
    if (!searchQuery.trim()) return rev;
    return rev.filter((th) =>
      threadMatchesQuery(th, searchQuery, locale, historyDbg),
    );
  }, [threads, searchQuery, locale, historyDbg]);

  useEffect(() => {
    if (threads.length === 0) {
      setSelectedKey(null);
      return;
    }
    if (filteredSidebar.length === 0) {
      setSelectedKey(null);
      return;
    }
    setSelectedKey((prev) => {
      if (prev && filteredSidebar.some((x) => threadKey(x) === prev)) return prev;
      return threadKey(filteredSidebar[0]!);
    });
  }, [threads, filteredSidebar]);

  const selectedThread = useMemo(
    () => threads.find((x) => threadKey(x) === selectedKey) ?? null,
    [threads, selectedKey],
  );

  const searchActive = Boolean(searchQuery.trim());
  const listShown = filteredSidebar.length;

  useEffect(() => {
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTop = 0;
    }
  }, [selectedKey]);

  const renderDetail = (thread: HistoryThread) => {
    if (thread.kind === "report") {
      const detail = thread.detail;
      const snapShown = sanitizeLiveDataSnapshotForHistory(
        detail.live_data_snapshot,
        historyDbg,
      );
      const hasTechData = Object.keys(snapShown).length > 0;
      return (
        <Stack key={`report-${detail.id}`} gap="xs">
          <Group justify="center" gap="xs">
            <Badge size="xs" variant="light">
              {t("badgeAnalysis")}
            </Badge>
            <Text size="xs" c="dimmed" ta="center">
              {formatDate(detail.created_at, locale)} · #{detail.id}
            </Text>
          </Group>

          <Box style={{ display: "flex", justifyContent: "flex-end" }}>
            <Box
              maw="90%"
              p="sm"
              style={{
                borderRadius: "12px 12px 4px 12px",
                background: "var(--mantine-color-blue-light)",
                border: "1px solid var(--mantine-color-blue-light-color)",
              }}
            >
              <Text size="xs" c="dimmed" tt="uppercase" mb={4}>
                {t("chatYou")}
              </Text>
              <Text size="sm" lh={1.45} style={{ whiteSpace: "pre-wrap" }}>
                {formatUserRequestFull(detail, historyDbg)}
              </Text>
            </Box>
          </Box>

          <Box style={{ display: "flex", justifyContent: "flex-start" }}>
            <Box
              maw="90%"
              p="sm"
              style={{
                borderRadius: "12px 12px 12px 4px",
                background: "var(--mantine-color-default-hover)",
                border: "1px solid var(--mantine-color-default-border)",
              }}
            >
              <Text size="xs" c="dimmed" tt="uppercase" mb={4}>
                {t("chatAi")}
              </Text>
              <Text size="sm" lh={1.45} style={{ whiteSpace: "pre-wrap" }}>
                {detail.ai_analysis}
              </Text>
            </Box>
          </Box>

          {hasTechData && (
            <details>
              <Text component="summary" size="xs" c="dimmed" style={{ cursor: "pointer" }}>
                {historyDbg ? t("snapshotDebugFull") : t("snapshotTechnical")}
              </Text>
              <ScrollArea h={200} mt="xs">
                <Text size="xs" ff="monospace" component="pre">
                  {JSON.stringify(
                    historyDbg ? detail.live_data_snapshot : snapShown,
                    null,
                    2,
                  )}
                </Text>
              </ScrollArea>
            </details>
          )}
        </Stack>
      );
    }

    const detail = thread.detail;
    return (
      <Stack key={`chat-${detail.id}`} gap="xs">
        <Group justify="center" gap="xs">
          <Badge size="xs" variant="outline" leftSection={<IconMessageCircle size={10} />}>
            {t("badgeChat")}
          </Badge>
          <Text size="xs" c="dimmed" ta="center">
            {t("chatSessionLine", {
              updated: formatDate(detail.updated_at, locale),
              id: detail.id,
            })}
            {detail.title ? ` · ${detail.title}` : ""}
          </Text>
        </Group>

        {detail.messages.length === 0 ? (
          <Text size="sm" c="dimmed" ta="center" fs="italic">
            {t("chatSessionEmpty")}
          </Text>
        ) : (
          <Stack gap={6}>
            {detail.messages.map((m) => (
              <Box
                key={m.id}
                style={{
                  display: "flex",
                  justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <Box
                  maw="90%"
                  p="sm"
                  style={{
                    borderRadius:
                      m.role === "user" ? "12px 12px 4px 12px" : "12px 12px 12px 4px",
                    background:
                      m.role === "user"
                        ? "var(--mantine-color-blue-light)"
                        : "var(--mantine-color-default-hover)",
                    border:
                      m.role === "user"
                        ? "1px solid var(--mantine-color-blue-light-color)"
                        : "1px solid var(--mantine-color-default-border)",
                  }}
                >
                  <Text size="xs" c="dimmed" tt="uppercase" mb={4}>
                    {m.role === "user" ? t("chatYou") : t("chatAi")}
                  </Text>
                  <Text size="sm" lh={1.45} style={{ whiteSpace: "pre-wrap" }}>
                    {m.content}
                  </Text>
                </Box>
              </Box>
            ))}
          </Stack>
        )}
      </Stack>
    );
  };

  return (
    <Stack gap="md" maw={880} mx="auto" px="sm" py="sm" w="100%">
      <Stack gap={4} align="center">
        <Title order={3} ta="center" fz="h4">
          {t("title")}
        </Title>
        <Text c="dimmed" size="xs" maw={520} ta="center" lh={1.5}>
          {t("subtitleMerged")}
        </Text>
      </Stack>

      <Group justify="space-between" wrap="wrap" gap="sm">
        <Text size="sm" c="dimmed" maw={{ base: "100%", sm: "70%" }}>
          {t("footerChats", {
            reports: threads.filter((x) => x.kind === "report").length,
            reportsTotal: reportTotal,
            chats: threads.filter((x) => x.kind === "chat").length,
            chatsTotal: chatTotal,
            blocks: threads.length,
          })}
          {searchActive
            ? ` · ${t("filteredList", { shown: listShown, total: threads.length })}`
            : ""}
        </Text>
        <Button
          variant="light"
          leftSection={<IconRefresh size={16} />}
          onClick={() => void load()}
          loading={loading}
        >
          {t("refresh")}
        </Button>
      </Group>

      {error && (
        <Text c="red" size="sm" ta="center">
          {error}
        </Text>
      )}

      {loading && threads.length === 0 ? (
        <Center py="xl">
          <Loader />
        </Center>
      ) : threads.length === 0 ? (
        <Text c="dimmed" size="sm" ta="center" py="xl">
          {t("emptyBoth")}
        </Text>
      ) : (
        <>
          <TextInput
            placeholder={t("searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftSection={<IconSearch size={16} stroke={1.5} />}
            radius="md"
            size="sm"
            maw={440}
            mx="auto"
            w="100%"
            aria-label={t("searchPlaceholder")}
          />

          <Card
            withBorder
            padding={0}
            radius="md"
            shadow="sm"
            style={{ overflow: "hidden" }}
          >
          <Flex
            direction={{ base: "column", md: "row" }}
            align="stretch"
            gap={0}
            mih={{ base: 0, md: 0 }}
          >
            <Box
              className="flex min-w-0 flex-1 flex-col border-b border-[var(--mantine-color-default-border)] md:border-r md:border-b-0 md:border-[var(--mantine-color-default-border)]"
            >
              <Box
                ref={mainScrollRef}
                style={{
                  flex: 1,
                  minHeight: 0,
                  maxHeight: "min(84vh, 680px)",
                  overflowY: "auto",
                  overscrollBehavior: "contain",
                }}
                p="sm"
              >
                <Box maw={560} mx="auto">
                  {searchActive && listShown === 0 ? (
                    <Text size="sm" c="dimmed" ta="center" py="xl">
                      {t("noSearchResults")}
                    </Text>
                  ) : selectedThread ? (
                    renderDetail(selectedThread)
                  ) : (
                    <Text size="sm" c="dimmed" ta="center" py="xl">
                      {t("pickFromSidebar")}
                    </Text>
                  )}
                </Box>
              </Box>
              <Text
                size="xs"
                c="dimmed"
                p="xs"
                ta="center"
                style={{ borderTop: "1px solid var(--mantine-color-default-border)" }}
              >
                {t("footerChats", {
                  reports: threads.filter((x) => x.kind === "report").length,
                  reportsTotal: reportTotal,
                  chats: threads.filter((x) => x.kind === "chat").length,
                  chatsTotal: chatTotal,
                  blocks: threads.length,
                })}
                {searchActive
                  ? ` · ${t("filteredList", { shown: listShown, total: threads.length })}`
                  : ""}
              </Text>
            </Box>

            <Box
              w={{ base: "100%", md: 280 }}
              bg="var(--mantine-color-body)"
              style={{
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Box
                p="xs"
                style={{ borderBottom: "1px solid var(--mantine-color-default-border)" }}
              >
                <Text size="xs" fw={600} tt="uppercase" c="dimmed">
                  {t("sidebarTitle")}
                </Text>
                {searchActive ? (
                  <Text size="xs" c="dimmed" mt={4}>
                    {t("filteredList", { shown: listShown, total: threads.length })}
                  </Text>
                ) : null}
              </Box>
              <ScrollArea
                flex={1}
                mah={{ base: 400, md: "min(84vh, 680px)" }}
                type="auto"
                offsetScrollbars
              >
                <Stack gap={8} p="xs">
                  {filteredSidebar.length === 0 ? (
                    <Text size="xs" c="dimmed" ta="center" py="md">
                      {searchActive ? t("noSearchResults") : "—"}
                    </Text>
                  ) : null}
                  {filteredSidebar.map((th) => {
                    const key = threadKey(th);
                    const sel = key === selectedKey;
                    const when =
                      th.kind === "report"
                        ? formatDate(th.detail.created_at, locale)
                        : formatDate(th.detail.updated_at, locale);
                    return (
                      <UnstyledButton
                        key={key}
                        onClick={() => setSelectedKey(key)}
                        style={{
                          display: "block",
                          width: "100%",
                          textAlign: "left",
                          padding: "10px 12px",
                          borderRadius: 12,
                          border: `1px solid ${sel ? "var(--mantine-color-blue-filled)" : "transparent"}`,
                          background: sel
                            ? "var(--mantine-color-blue-light)"
                            : "var(--mantine-color-default-hover)",
                          transition: "background 0.15s ease, box-shadow 0.15s ease",
                          boxShadow: sel ? "0 1px 4px rgb(0 0 0 / 0.06)" : undefined,
                        }}
                      >
                        <Group gap={6} wrap="nowrap">
                          {th.kind === "chat" ? (
                            <Badge size="xs" variant="outline" leftSection={<IconMessageCircle size={10} />}>
                              {t("badgeChat")}
                            </Badge>
                          ) : (
                            <Badge size="xs" variant="light">
                              {t("badgeAnalysis")}
                            </Badge>
                          )}
                          <Text size="xs" ff="monospace" c="dimmed">
                            #{th.detail.id}
                          </Text>
                        </Group>
                        <Text size="xs" c="dimmed" mt={4}>
                          {when}
                        </Text>
                        <Text size="xs" lineClamp={2} mt={4}>
                          {threadTabSubtitle(th)}
                        </Text>
                      </UnstyledButton>
                    );
                  })}
                </Stack>
              </ScrollArea>
            </Box>
          </Flex>
          </Card>
        </>
      )}
    </Stack>
  );
}
