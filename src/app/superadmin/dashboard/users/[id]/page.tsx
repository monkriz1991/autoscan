"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Container,
  Title,
  Card,
  Stack,
  TextInput,
  Button,
  Loader,
  Group,
} from "@mantine/core";
import { getAdminUser, ApiError } from "@/lib/api";

type User = {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  is_staff?: boolean;
  date_joined?: string;
};

export default function UserDetailsPage() {
  const { id } = useParams();
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await getAdminUser(id as string);
      setUser(data);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        router.push("/superadmin/dashboard/users");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [id]);

  if (loading || !user) return <Loader />;

  const name = [user.first_name, user.last_name].filter(Boolean).join(" ") || user.email;

  return (
    <Container size="sm" py="xl">
      <Title order={2} mb="lg">
        Просмотр пользователя
      </Title>

      <Card withBorder shadow="sm">
        <Stack>
          <TextInput label="Имя" value={name} readOnly />

          <TextInput label="Email" value={user.email} readOnly />

          <TextInput
            label="Роль"
            value={user.is_staff ? "SUPERADMIN" : "BUSINESS_OWNER"}
            readOnly
          />

          <Group justify="space-between" mt="md">
            <Button
              variant="light"
              onClick={() => router.push("/superadmin/dashboard/users")}
            >
              Назад
            </Button>
          </Group>
        </Stack>
      </Card>
    </Container>
  );
}
