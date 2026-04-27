"use client";

import { useCallback, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { useDisclosure } from "@mantine/hooks";
import {
  Badge,
  Button,
  Card,
  Group,
  Modal,
  PasswordInput,
  Stack,
  Text,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { ApiError, changePassword, getApiErrorMessage } from "@/lib/api";

const MIN_PASSWORD_LEN = 8;

function drfFieldFirst(val: unknown): string | undefined {
  if (typeof val === "string" && val) return val;
  if (Array.isArray(val) && val.length > 0 && typeof val[0] === "string") {
    return val[0];
  }
  return undefined;
}

function parsePasswordApiErrors(
  data: unknown,
): Partial<Record<"old_password" | "new_password1" | "new_password2", string>> {
  if (typeof data !== "object" || data === null) {
    return {};
  }
  const o = data as Record<string, unknown>;
  return {
    old_password: drfFieldFirst(o.old_password),
    new_password1: drfFieldFirst(o.new_password1),
    new_password2: drfFieldFirst(o.new_password2),
  };
}

export type AccountSecuritySectionProps = {
  hasPassword: boolean;
  isBlocked: boolean;
  onPasswordUpdated: () => void | Promise<void>;
};

export function AccountSecuritySection({
  hasPassword,
  isBlocked,
  onPasswordUpdated,
}: AccountSecuritySectionProps) {
  const t = useTranslations("accountPage");
  const [modalOpen, { open: openModal, close: closeModal }] = useDisclosure(false);

  const [mP1, setMP1] = useState("");
  const [mP2, setMP2] = useState("");
  const [mFieldErrors, setMFieldErrors] = useState<{
    new_password1?: string;
    new_password2?: string;
  }>({});
  const [mLoading, setMLoading] = useState(false);

  const [oldPass, setOldPass] = useState("");
  const [cP1, setCP1] = useState("");
  const [cP2, setCP2] = useState("");
  const [cFieldErrors, setCFieldErrors] = useState<
    Partial<Record<"old_password" | "new_password1" | "new_password2", string>>
  >({});
  const [cLoading, setCLoading] = useState(false);

  const resetModal = useCallback(() => {
    setMP1("");
    setMP2("");
    setMFieldErrors({});
  }, []);

  const validateNewPair = useCallback(
    (p1: string, p2: string) => {
      if (p1.length < MIN_PASSWORD_LEN) {
        return { field: "new_password1" as const, message: t("validationMinLength") };
      }
      if (p1 !== p2) {
        return { field: "new_password2" as const, message: t("validationMismatch") };
      }
      return null;
    },
    [t],
  );

  const saveModalPassword = useCallback(async () => {
    const p1 = mP1;
    const p2 = mP2;
    const v = validateNewPair(p1, p2);
    if (v) {
      setMFieldErrors(
        v.field === "new_password1"
          ? { new_password1: v.message }
          : { new_password2: v.message },
      );
      return;
    }
    setMFieldErrors({});
    setMLoading(true);
    try {
      await changePassword({
        new_password1: p1,
        new_password2: p2,
      });
      closeModal();
      resetModal();
      await onPasswordUpdated();
      notifications.show({
        color: "teal",
        message: t("passwordSetSuccess"),
      });
    } catch (e) {
      if (e instanceof ApiError) {
        const f = parsePasswordApiErrors(e.data);
        setMFieldErrors({
          new_password1: f.new_password1,
          new_password2: f.new_password2,
        });
        if (!f.new_password1 && !f.new_password2) {
          notifications.show({
            color: "red",
            message: getApiErrorMessage(e),
          });
        }
      } else {
        notifications.show({ color: "red", message: t("loadError") });
      }
    } finally {
      setMLoading(false);
    }
  }, [mP1, mP2, validateNewPair, closeModal, resetModal, onPasswordUpdated, t]);

  const onChangeFormSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      const p1 = cP1;
      const p2 = cP2;
      const o = oldPass;
      if (!o) {
        setCFieldErrors({ old_password: t("fieldRequired") });
        return;
      }
      const v = validateNewPair(p1, p2);
      if (v) {
        setCFieldErrors(
          v.field === "new_password1"
            ? { new_password1: v.message }
            : { new_password2: v.message },
        );
        return;
      }
      setCFieldErrors({});
      setCLoading(true);
      try {
        await changePassword({
          old_password: o,
          new_password1: p1,
          new_password2: p2,
        });
        setOldPass("");
        setCP1("");
        setCP2("");
        await onPasswordUpdated();
        notifications.show({
          color: "teal",
          message: t("passwordChangeSuccess"),
        });
      } catch (err) {
        if (err instanceof ApiError) {
          const f = parsePasswordApiErrors(err.data);
          setCFieldErrors(f);
          if (!f.old_password && !f.new_password1 && !f.new_password2) {
            notifications.show({
              color: "red",
              message: getApiErrorMessage(err),
            });
          }
        } else {
          notifications.show({ color: "red", message: t("loadError") });
        }
      } finally {
        setCLoading(false);
      }
    },
    [cP1, cP2, oldPass, validateNewPair, onPasswordUpdated, t],
  );

  return (
    <>
      <Stack gap="md" mt="md">
        {isBlocked ? (
          <Text size="sm" c="red">
            {t("blocked")}
          </Text>
        ) : (
          <>
            {!hasPassword && (
              <Card withBorder p="md" radius="md">
                <Stack gap="sm">
                  <Text fw={600}>{t("noPasswordTitle")}</Text>
                  <Text size="sm" c="dimmed">
                    {t("noPasswordDescription")}
                  </Text>
                  <Button w="fit-content" onClick={openModal}>
                    {t("setPasswordCta")}
                  </Button>
                </Stack>
              </Card>
            )}

            {hasPassword && (
              <Card withBorder p="md" radius="md" component="form" onSubmit={onChangeFormSubmit}>
                <Stack gap="md">
                  <PasswordInput
                    required
                    label={t("currentPassword")}
                    value={oldPass}
                    onChange={(e) => setOldPass(e.currentTarget.value)}
                    error={cFieldErrors.old_password}
                  />
                  <PasswordInput
                    required
                    label={t("newPasswordLabel")}
                    value={cP1}
                    onChange={(e) => setCP1(e.currentTarget.value)}
                    error={cFieldErrors.new_password1}
                  />
                  <PasswordInput
                    required
                    label={t("confirmNewPassword")}
                    value={cP2}
                    onChange={(e) => setCP2(e.currentTarget.value)}
                    error={cFieldErrors.new_password2}
                  />
                  <Button type="submit" loading={cLoading}>
                    {t("changePasswordCta")}
                  </Button>
                </Stack>
              </Card>
            )}
          </>
        )}
      </Stack>

      <Modal
        opened={modalOpen}
        onClose={() => {
          closeModal();
          resetModal();
        }}
        title={t("modalSetPassword")}
        centered
      >
        <Stack gap="md">
          <PasswordInput
            required
            label={t("newPassword")}
            value={mP1}
            onChange={(e) => {
              setMP1(e.currentTarget.value);
              setMFieldErrors({});
            }}
            error={mFieldErrors.new_password1}
          />
          <PasswordInput
            required
            label={t("confirmPassword")}
            value={mP2}
            onChange={(e) => {
              setMP2(e.currentTarget.value);
              setMFieldErrors({});
            }}
            error={mFieldErrors.new_password2}
          />
          <Group justify="flex-end" mt="xs">
            <Button onClick={() => void saveModalPassword()} loading={mLoading}>
              {t("save")}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}

export type AccountSecurityLayoutProps = {
  title: string;
  badge: string;
  children: React.ReactNode;
};

export function AccountSecurityLayout({ title, badge, children }: AccountSecurityLayoutProps) {
  return (
    <Card withBorder p="lg" radius="md" shadow="sm">
      <Group justify="space-between" align="flex-start" wrap="wrap" gap="sm">
        <Text fw={700} size="lg">
          {title}
        </Text>
        <Badge variant="light" color="blue">
          {badge}
        </Badge>
      </Group>
      {children}
    </Card>
  );
}
