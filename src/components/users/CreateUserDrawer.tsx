"use client";

import { useState } from "react";
import { Drawer, Stack, TextInput, PasswordInput, Button } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { register, ApiError } from "@/lib/api";

type Props = {
  opened: boolean;
  onClose: () => void;
  onCreated: () => void;
};

export default function CreateUserDrawer({
  opened,
  onClose,
  onCreated,
}: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const validateEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleCreate = async () => {
    if (!email || !password || !repeatPassword) {
      notifications.show({
        title: "Ошибка",
        message: "Заполните все поля",
        color: "red",
      });
      return;
    }

    if (!validateEmail(email)) {
      notifications.show({
        title: "Ошибка",
        message: "Некорректный email",
        color: "red",
      });
      return;
    }

    if (password !== repeatPassword) {
      notifications.show({
        title: "Ошибка",
        message: "Пароли не совпадают",
        color: "red",
      });
      return;
    }

    try {
      setLoading(true);

      const data = await register(
        { email, password1: password, password2: repeatPassword },
        { storeTokens: false },
      );

      if (data.access && data.refresh) {
        notifications.show({
          title: "Успешно",
          message: "Пользователь создан",
          color: "green",
        });
        onCreated();
        onClose();
      } else {
        notifications.show({
          title: "Успешно",
          message:
            "Пользователь зарегистрирован. Проверьте email для подтверждения.",
          color: "green",
        });
        onCreated();
        onClose();
      }

      setEmail("");
      setPassword("");
      setRepeatPassword("");
    } catch (error) {
      const msg =
        error instanceof ApiError
          ? (error.data as { detail?: string | Record<string, string[]> })?.detail
            ? typeof (error.data as { detail?: unknown }).detail === "string"
              ? (error.data as { detail: string }).detail
              : Object.values(
                  (error.data as { detail: Record<string, string[]> }).detail,
                )
                  .flat()
                  .join(", ")
            : error.message
          : "Ошибка создания";
      notifications.show({ title: "Ошибка", message: msg, color: "red" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="right"
      title="Создание пользователя"
      padding="lg"
      size="md"
    >
      <Stack>
        <TextInput
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <PasswordInput
          label="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <PasswordInput
          label="Повторите пароль"
          value={repeatPassword}
          onChange={(e) => setRepeatPassword(e.target.value)}
        />

        <Button onClick={handleCreate} loading={loading}>
          Создать
        </Button>
      </Stack>
    </Drawer>
  );
}
