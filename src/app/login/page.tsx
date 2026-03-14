"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Container,
  Card,
  Title,
  TextInput,
  PasswordInput,
  Button,
  Stack,
  Notification,
} from "@mantine/core";
import { login, ApiError } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      router.push("/business/admin/services");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? (err.data as { detail?: string })?.detail || err.message
          : "Ошибка входа",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size="xs" py="xl">
      <Card withBorder shadow="sm" radius="md" p="xl">
        <Stack>
          <Title order={3} ta="center">
            Вход в систему
          </Title>

          {error && (
            <Notification color="red" onClose={() => setError("")}>
              {error}
            </Notification>
          )}

          <TextInput
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <PasswordInput
            label="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button fullWidth loading={loading} onClick={handleSubmit}>
            Войти
          </Button>
        </Stack>
      </Card>
    </Container>
  );
}
