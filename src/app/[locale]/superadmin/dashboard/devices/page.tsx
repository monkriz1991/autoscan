"use client";

import { useState, useEffect, useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  Card,
  Title,
  Text,
  Stack,
  Group,
  Badge,
  Loader,
  Center,
  Notification,
  Button,
  Table,
  ActionIcon,
} from "@mantine/core";
import { IconDeviceDesktop, IconTrash } from "@tabler/icons-react";
import { getDevices, revokeDevice, isAuthenticated, logout, type UserDevice } from "@/lib/api";

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

export default function DashboardDevicesPage() {
  const t = useTranslations("devices");
  const locale = useLocale();
  const router = useRouter();
  const [devices, setDevices] = useState<UserDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revokingId, setRevokingId] = useState<number | null>(null);

  const fetchDevices = useCallback(async () => {
    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }
    try {
      const data = await getDevices();
      setDevices(Array.isArray(data) ? data : []);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [router, t]);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }
    fetchDevices();
  }, [fetchDevices, router]);

  const handleLogout = () => {
    logout();
    router.replace("/");
  };

  const handleRevokeDevice = async (deviceId: number) => {
    setRevokingId(deviceId);
    try {
      await revokeDevice(deviceId);
      setDevices((prev) => prev.filter((d) => d.id !== deviceId));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("revokeError"));
    } finally {
      setRevokingId(null);
    }
  };

  if (loading) {
    return (
      <Center py="xl">
        <Loader size="lg" />
      </Center>
    );
  }

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={4}>{t("title")}</Title>
        <Button variant="subtle" size="xs" onClick={handleLogout}>
          {t("logout")}
        </Button>
      </Group>

      {error && (
        <Notification color="red" onClose={() => setError("")}>
          {error}
        </Notification>
      )}

      {devices.length === 0 && !error && (
        <Card withBorder shadow="sm" radius="md" p="xl">
          <Group gap="md">
            <IconDeviceDesktop size={48} stroke={1} />
            <Stack gap={4}>
              <Text fw={500}>{t("noDevices")}</Text>
              <Text size="sm" c="dimmed">
                {t("noDevicesDesc")}
              </Text>
            </Stack>
          </Group>
        </Card>
      )}

      {devices.length > 0 && (
        <Card withBorder shadow="sm" radius="md" p="md">
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t("application")}</Table.Th>
                <Table.Th>{t("device")}</Table.Th>
                <Table.Th>{t("id")}</Table.Th>
                <Table.Th>{t("lastActive")}</Table.Th>
                <Table.Th>{t("status")}</Table.Th>
                <Table.Th style={{ width: 60 }} />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {devices.map((d) => (
                <Table.Tr key={d.id}>
                  <Table.Td>{d.application_name || "—"}</Table.Td>
                  <Table.Td>{d.device_name || "—"}</Table.Td>
                  <Table.Td>
                    <Text size="sm" ff="monospace" c="dimmed">
                      {d.hardware_id}
                    </Text>
                  </Table.Td>
                  <Table.Td>{formatDate(d.last_active, locale)}</Table.Td>
                  <Table.Td>
                    {d.is_active ? (
                      <Badge color="green" size="sm">
                        {t("online")}
                      </Badge>
                    ) : (
                      <Badge color="gray" size="sm">
                        {t("offline")}
                      </Badge>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      aria-label={t("revoke")}
                      loading={revokingId === d.id}
                      onClick={() => handleRevokeDevice(d.id)}
                    >
                      <IconTrash size={18} />
                    </ActionIcon>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Card>
      )}
    </Stack>
  );
}
