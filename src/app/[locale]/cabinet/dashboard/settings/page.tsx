"use client";

import { useState, useEffect } from "react";
import {
  Title,
  Card,
  Text,
  TextInput,
  Button,
  Stack,
  Loader,
  Center,
  Notification,
  Group,
  Avatar,
  FileInput,
} from "@mantine/core";
import { useTranslations } from "next-intl";
import { getMe, updateMe, uploadAvatar } from "@/lib/api";
import type { UserProfile } from "@/lib/api";

export default function CabinetSettingsPage() {
  const t = useTranslations("cabinetSettingsPage");
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const loadUser = () => {
    getMe()
      .then((u) => {
        setUser(u);
        setFirstName(u.first_name ?? "");
        setLastName(u.last_name ?? "");
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadUser();
  }, []);

  const handleSaveProfile = async () => {
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      const updated = await updateMe({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
      });
      setUser(updated);
      setSuccess(t("successProfile"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorSave"));
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (file: File | null) => {
    setAvatarFile(file);
    if (!file) return;
    setError("");
    setSuccess("");
    setUploadingAvatar(true);
    try {
      const updated = await uploadAvatar(file);
      setUser(updated);
      setSuccess(t("successAvatar"));
      setAvatarFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorAvatar"));
    } finally {
      setUploadingAvatar(false);
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
    <Stack gap="xl">
      <Title order={1}>{t("title")}</Title>

      {error && (
        <Notification color="red" onClose={() => setError("")}>
          {error}
        </Notification>
      )}
      {success && (
        <Notification color="green" onClose={() => setSuccess("")}>
          {success}
        </Notification>
      )}

      <Card withBorder p="lg" radius="md" shadow="sm">
        <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb="md">
          {t("userDataSection")}
        </Text>
        <Group mb="md">
          <Avatar
            src={user?.avatar_url}
            radius="xl"
            size={80}
            color="silver"
          >
            {user?.email?.slice(0, 2).toUpperCase() ?? "?"}
          </Avatar>
          <Stack gap="xs">
            <FileInput
              label={t("avatarLabel")}
              placeholder={t("avatarPlaceholder")}
              accept="image/jpeg,image/png,image/gif,image/webp"
              value={avatarFile}
              onChange={handleAvatarUpload}
              disabled={uploadingAvatar}
              clearable
            />
            <Text size="xs" c="dimmed">
              {t("avatarHint")}
            </Text>
          </Stack>
        </Group>
        <TextInput
          label={t("firstNameLabel")}
          placeholder={t("firstNamePlaceholder")}
          value={firstName}
          onChange={(e) => setFirstName(e.currentTarget.value)}
        />
        <TextInput
          label={t("lastNameLabel")}
          placeholder={t("lastNamePlaceholder")}
          value={lastName}
          onChange={(e) => setLastName(e.currentTarget.value)}
          mt="md"
        />
        <Group mt="md">
          <Button
            onClick={handleSaveProfile}
            loading={saving}
            variant="light"
            size="sm"
          >
            {t("save")}
          </Button>
        </Group>
      </Card>
    </Stack>
  );
}
