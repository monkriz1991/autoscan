"use client";

import { useTranslations } from "next-intl";
import { Group, Stack, Text } from "@mantine/core";
import { IconCheck, IconX } from "@tabler/icons-react";

export interface PasswordStrengthProps {
  password: string;
}

/** Три критерия сложности пароля с индикацией в реальном времени. */
export default function PasswordStrength({ password }: PasswordStrengthProps) {
  const t = useTranslations("auth");
  const minLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasUpper = /[A-Z]/.test(password);

  const row = (ok: boolean, label: string) => (
    <Group gap="xs" wrap="nowrap">
      {ok ? (
        <IconCheck size={18} color="var(--mantine-color-teal-6)" />
      ) : (
        <IconX size={18} color="var(--mantine-color-gray-5)" />
      )}
      <Text size="sm" c={ok ? "teal.7" : "dimmed"}>
        {label}
      </Text>
    </Group>
  );

  return (
    <Stack gap={4}>
      {row(minLength, t("passwordHintLength"))}
      {row(hasNumber, t("passwordHintNumber"))}
      {row(hasUpper, t("passwordHintUpper"))}
    </Stack>
  );
}
