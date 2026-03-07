"use client";

import { useState } from "react";
import { Drawer, Stack, TextInput, PasswordInput, Button } from "@mantine/core";
import { notifications } from "@mantine/notifications";

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
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const validateEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleCreate = async () => {
    if (!name || !email || !password || !repeatPassword) {
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

      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          role: "BUSINESS_OWNER",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Ошибка создания");
      }

      notifications.show({
        title: "Успешно",
        message: "Пользователь создан",
        color: "green",
      });

      setName("");
      setEmail("");
      setPassword("");
      setRepeatPassword("");

      onCreated();
      onClose();
    } catch (error: any) {
      notifications.show({
        title: "Ошибка",
        message: error.message,
        color: "red",
      });
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
          label="Имя"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

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
