"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Alert, Button, Group, Stack, Text } from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";
import {
  type NotificationSseEvent,
  type UserNotification,
  getNotificationsInbox,
  markNotificationRead,
  subscribeNotificationsStream,
} from "@/lib/api";

function mergeNotifications(
  current: UserNotification[],
  incoming: UserNotification[],
): UserNotification[] {
  const byId = new Map<number, UserNotification>();
  for (const row of current) byId.set(row.id, row);
  for (const row of incoming) byId.set(row.id, row);
  return Array.from(byId.values()).sort((a, b) => b.id - a.id);
}

export default function UserNotifications() {
  const t = useTranslations("notifications");
  const [items, setItems] = useState<UserNotification[]>([]);
  const [busyId, setBusyId] = useState<number | null>(null);
  const lastIdRef = useRef(0);
  const streamAbortRef = useRef<AbortController | null>(null);

  const syncInbox = useCallback(async () => {
    const data = await getNotificationsInbox({ afterId: lastIdRef.current, limit: 100 });
    if (!data.items.length) return;
    setItems((prev) => mergeNotifications(prev, data.items));
    lastIdRef.current = Math.max(lastIdRef.current, data.last_id);
  }, []);

  useEffect(() => {
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    let stopped = false;

    const startPollingFallback = () => {
      if (pollTimer) return;
      pollTimer = setInterval(() => {
        void syncInbox().catch(() => {
          /* polling fallback is best-effort */
        });
      }, 15000);
    };

    const onSseEvent = (event: NotificationSseEvent) => {
      if (event.event === "notification") {
        const row = event.data as Record<string, unknown>;
        const notification: UserNotification = {
          id: Number(row.id ?? 0),
          title: String(row.title ?? ""),
          body: String(row.body ?? ""),
          display_mode: String(row.display_mode ?? "") === "one_time" ? "one_time" : "banner",
          starts_at: row.starts_at ? String(row.starts_at) : null,
          ends_at: row.ends_at ? String(row.ends_at) : null,
          created_at: String(row.created_at ?? ""),
          is_read: Boolean(row.is_read),
        };
        lastIdRef.current = Math.max(lastIdRef.current, notification.id);
        setItems((prev) => mergeNotifications(prev, [notification]));
      }
    };

    const startRealtimeLoop = async () => {
      while (!stopped) {
        const controller = new AbortController();
        streamAbortRef.current = controller;
        try {
          await subscribeNotificationsStream({
            afterId: lastIdRef.current,
            onEvent: onSseEvent,
            signal: controller.signal,
          });
        } catch {
          if (!stopped) {
            startPollingFallback();
            await new Promise((resolve) => setTimeout(resolve, 3000));
          }
        }
      }
    };

    void syncInbox().catch(() => {
      startPollingFallback();
    });
    void startRealtimeLoop();

    return () => {
      stopped = true;
      if (pollTimer) clearInterval(pollTimer);
      streamAbortRef.current?.abort();
    };
  }, [syncInbox]);

  const visibleItems = useMemo(
    () => items.filter((item) => item.display_mode === "banner" || !item.is_read),
    [items],
  );

  const onMarkRead = useCallback(async (id: number) => {
    setBusyId(id);
    try {
      await markNotificationRead(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } finally {
      setBusyId(null);
    }
  }, []);

  if (!visibleItems.length) return null;

  return (
    <Stack gap="sm" mb="md">
      {visibleItems.map((item) => (
        <Alert
          key={item.id}
          variant="light"
          color="silver"
          icon={<IconInfoCircle size={20} />}
          title={item.title}
          radius="md"
        >
          <Stack gap="xs">
            <Text size="sm">{item.body}</Text>
            {item.display_mode === "one_time" && (
              <Group justify="flex-end">
                <Button
                  size="xs"
                  variant="default"
                  loading={busyId === item.id}
                  onClick={() => void onMarkRead(item.id)}
                >
                  {t("markRead")}
                </Button>
              </Group>
            )}
          </Stack>
        </Alert>
      ))}
    </Stack>
  );
}
