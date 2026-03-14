"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { register, ApiError } from "@/lib/api";

const DEFAULT_AFTER_AUTH = "/superadmin/dashboard";

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next") || DEFAULT_AFTER_AUTH;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");

    if (!email || !password || !password2) {
      setError("Заполните все поля");
      return;
    }

    if (password.length < 8) {
      setError("Пароль должен содержать минимум 8 символов");
      return;
    }

    if (password !== password2) {
      setError("Пароли не совпадают");
      return;
    }

    try {
      setLoading(true);

      const data = await register({
        email,
        password1: password,
        password2,
      });

      if (data.access && data.refresh) {
        router.push(nextUrl);
      } else if (data.detail) {
        setError(data.detail);
      } else {
        setError(
          "Регистрация успешна. Проверьте email для подтверждения аккаунта.",
        );
      }
    } catch (err) {
      if (err instanceof ApiError) {
        const d = err.data as Record<string, unknown>;
        const messages: string[] = [];
        if (typeof d?.detail === "string") {
          messages.push(d.detail);
        } else if (typeof d?.detail === "object" && d.detail !== null) {
          Object.values(d.detail as Record<string, string[]>).flat().forEach((m) =>
            messages.push(String(m)),
          );
        }
        for (const [key, val] of Object.entries(d || {})) {
          if (key !== "detail" && Array.isArray(val)) {
            val.forEach((m) => messages.push(String(m)));
          } else if (key !== "detail" && typeof val === "string") {
            messages.push(val);
          }
        }
        setError(messages.length > 0 ? messages.join(". ") : err.message);
      } else {
        setError(err instanceof Error ? err.message : "Ошибка регистрации");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size="xs" py="xl">
      <Card withBorder shadow="sm" radius="md" p="xl">
        <Stack>
          <Title order={3} ta="center">
            Регистрация бизнеса
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
            placeholder="Минимум 8 символов"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <PasswordInput
            label="Повторите пароль"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
          />

          <Button fullWidth loading={loading} onClick={handleSubmit}>
            Создать аккаунт
          </Button>
        </Stack>
      </Card>
    </Container>
  );
}
