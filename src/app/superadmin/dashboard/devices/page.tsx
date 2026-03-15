"use client";

import { useState, useEffect, useCallback } from "react";
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
  TextInput,
  PasswordInput,
  Button,
  Table,
  ActionIcon,
} from "@mantine/core";
import { IconDeviceDesktop, IconTrash } from "@tabler/icons-react";

const STORAGE_ACCESS = "django_access_token";
const STORAGE_REFRESH = "django_refresh_token";

interface Device {
  id: number;
  device_name: string;
  hardware_id: string;
  last_active: string;
  is_active: boolean;
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("ru-RU", {
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
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [needsAuth, setNeedsAuth] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [revokingId, setRevokingId] = useState<number | null>(null);

  const apiBase =
    (typeof window !== "undefined"
      ? process.env.NEXT_PUBLIC_API_BASE_URL
      : process.env.NEXT_PUBLIC_API_BASE_URL) || "";

  const fetchDevices = useCallback(async () => {
    if (!apiBase) {
      setError("API не настроен (NEXT_PUBLIC_API_BASE_URL)");
      setLoading(false);
      return;
    }

    const token =
      typeof window !== "undefined" ? localStorage.getItem(STORAGE_ACCESS) : null;
    if (!token) {
      setNeedsAuth(true);
      setLoading(false);
      return;
    }

    const url = `${apiBase.replace(/\/$/, "")}/users/me/devices/`;
    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        localStorage.removeItem(STORAGE_ACCESS);
        localStorage.removeItem(STORAGE_REFRESH);
        setNeedsAuth(true);
        setLoading(false);
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setDevices(Array.isArray(data) ? data : []);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  const handleAuthSubmit = async () => {
    setAuthError("");
    if (!authEmail || !authPassword) {
      setAuthError("Введите email и пароль");
      return;
    }
    if (!apiBase) {
      setAuthError("API не настроен");
      return;
    }

    setAuthLoading(true);
    try {
      const res = await fetch(`${apiBase.replace(/\/$/, "")}/auth/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authEmail, password: authPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.detail || "Неверный email или пароль");
        return;
      }
      if (data.access) {
        localStorage.setItem(STORAGE_ACCESS, data.access);
        if (data.refresh) localStorage.setItem(STORAGE_REFRESH, data.refresh);
        setNeedsAuth(false);
        setAuthEmail("");
        setAuthPassword("");
        setLoading(true);
        fetchDevices();
      } else {
        setAuthError("Некорректный ответ сервера");
      }
    } catch (err) {
      setAuthError("Ошибка соединения");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_ACCESS);
    localStorage.removeItem(STORAGE_REFRESH);
    setNeedsAuth(true);
    setDevices([]);
  };

  const handleRevokeDevice = async (deviceId: number) => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem(STORAGE_ACCESS) : null;
    if (!token || !apiBase) return;

    setRevokingId(deviceId);
    try {
      const res = await fetch(
        `${apiBase.replace(/\/$/, "")}/users/me/devices/${deviceId}/`,
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error("Ошибка отключения");
      setDevices((prev) => prev.filter((d) => d.id !== deviceId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка отключения устройства");
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

  if (needsAuth) {
    return (
      <Card withBorder shadow="sm" radius="md" p="xl" maw={400}>
        <Stack>
          <Title order={4}>Вход для раздела «Устройства»</Title>
          <Text size="sm" c="dimmed">
            Войдите в аккаунт GearMind AI (Django), чтобы просмотреть
            подключённые устройства.
          </Text>
          {authError && (
            <Notification color="red" onClose={() => setAuthError("")}>
              {authError}
            </Notification>
          )}
          <TextInput
            label="Email"
            type="email"
            value={authEmail}
            onChange={(e) => setAuthEmail(e.target.value)}
          />
          <PasswordInput
            label="Пароль"
            value={authPassword}
            onChange={(e) => setAuthPassword(e.target.value)}
          />
          <Button loading={authLoading} onClick={handleAuthSubmit}>
            Войти
          </Button>
        </Stack>
      </Card>
    );
  }

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={4}>Активные сессии устройств</Title>
        <Button variant="subtle" size="xs" onClick={handleLogout}>
          Выйти
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
              <Text fw={500}>Нет активных устройств</Text>
              <Text size="sm" c="dimmed">
                Подключённые приложения (десктоп, мобильное) отобразятся здесь
                после первого heartbeat.
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
                <Table.Th>Устройство</Table.Th>
                <Table.Th>ID</Table.Th>
                <Table.Th>Последняя активность</Table.Th>
                <Table.Th>Статус</Table.Th>
                <Table.Th style={{ width: 60 }} />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {devices.map((d) => (
                <Table.Tr key={d.id}>
                  <Table.Td>{d.device_name || "—"}</Table.Td>
                  <Table.Td>
                    <Text size="sm" ff="monospace" c="dimmed">
                      {d.hardware_id}
                    </Text>
                  </Table.Td>
                  <Table.Td>{formatDate(d.last_active)}</Table.Td>
                  <Table.Td>
                    {d.is_active ? (
                      <Badge color="green" size="sm">
                        Онлайн
                      </Badge>
                    ) : (
                      <Badge color="gray" size="sm">
                        Неактивен
                      </Badge>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      aria-label="Разлогинить устройство"
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
