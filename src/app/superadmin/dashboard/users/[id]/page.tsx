"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Container,
  Title,
  Card,
  Stack,
  TextInput,
  Select,
  Button,
  Loader,
  Group,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";

type User = {
  _id: string;
  name: string;
  email: string;
  role: string;
};

export default function UserDetailsPage() {
  const { id } = useParams();
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchUser = async () => {
    const res = await fetch(`/api/users/${id}`);
    const data = await res.json();
    setUser(data);
    setLoading(false);
  };

  useEffect(() => {
    if (id) fetchUser();
  }, [id]);

  const updateUser = async () => {
    if (!user) return;

    try {
      setSaving(true);

      const res = await fetch(`/api/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      });

      if (!res.ok) throw new Error("Ошибка обновления");

      notifications.show({
        title: "Успешно",
        message: "Данные пользователя обновлены",
        color: "green",
      });

      await fetchUser(); // обновляем данные без перехода
    } catch (error) {
      notifications.show({
        title: "Ошибка",
        message: "Не удалось обновить пользователя",
        color: "red",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user) return <Loader />;

  return (
    <Container size="sm" py="xl">
      <Title order={2} mb="lg">
        Редактирование пользователя
      </Title>

      <Card withBorder shadow="sm">
        <Stack>
          <TextInput
            label="Имя"
            value={user.name}
            onChange={(e) => setUser({ ...user, name: e.target.value })}
          />

          <TextInput
            label="Email"
            value={user.email}
            onChange={(e) => setUser({ ...user, email: e.target.value })}
          />

          <Select
            label="Роль"
            data={[
              { value: "SUPERADMIN", label: "SUPERADMIN" },
              { value: "BUSINESS_OWNER", label: "BUSINESS_OWNER" },
            ]}
            value={user.role}
            onChange={(value) => setUser({ ...user, role: value as string })}
          />

          <Group justify="space-between" mt="md">
            <Button
              variant="light"
              onClick={() => router.push("/superadmin/dashboard/users")}
            >
              Назад
            </Button>

            <Button onClick={updateUser} loading={saving}>
              Сохранить изменения
            </Button>
          </Group>
        </Stack>
      </Card>
    </Container>
  );
}
