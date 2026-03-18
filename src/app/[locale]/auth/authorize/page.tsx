"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  Container,
  Card,
  Title,
  Text,
  Button,
  Stack,
  Notification,
  Group,
  List,
} from "@mantine/core";
import type { UserDevice } from "@/lib/api";
import {
  createOAuth2Authorization,
  ApiError,
  isAuthenticated,
  getBillingStatus,
  getDevices,
  revokeDevice,
} from "@/lib/api";

function AuthorizeForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(false);
  const [revokingId, setRevokingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [sessionInfo, setSessionInfo] = useState<{ used: number; limit: number } | null>(null);
  const [devices, setDevices] = useState<UserDevice[]>([]);

  const clientId = searchParams.get("client_id") ?? "";
  const redirectUri = searchParams.get("redirect_uri") ?? "";
  const responseType = searchParams.get("response_type") ?? "";
  const scope = searchParams.get("scope") ?? "";
  const state = searchParams.get("state") ?? "";
  const codeChallenge = searchParams.get("code_challenge") ?? "";
  const codeChallengeMethod = searchParams.get("code_challenge_method") ?? "";

  useEffect(() => {
    if (!isAuthenticated()) {
      const next =
        typeof window !== "undefined"
          ? window.location.pathname + window.location.search
          : "";
      router.replace(`/login?next=${encodeURIComponent(next)}`);
      return;
    }
    const loadData = async () => {
      try {
        const [status, devs] = await Promise.all([getBillingStatus(), getDevices()]);
        const used = status.session_count ?? 0;
        const limit = status.session_limit ?? 1;
        setSessionInfo({ used, limit });
        setDevices(devs);
      } catch {
        setSessionInfo({ used: 0, limit: 1 });
        setDevices([]);
      }
    };
    loadData();
  }, [router]);

  const refreshData = useCallback(async () => {
    try {
      const [status, devs] = await Promise.all([getBillingStatus(), getDevices()]);
      setSessionInfo({
        used: status.session_count ?? 0,
        limit: status.session_limit ?? 1,
      });
      setDevices(devs);
    } catch {
      // keep current state
    }
  }, []);

  const handleRevoke = async (deviceId: number) => {
    setError("");
    setRevokingId(deviceId);
    try {
      await revokeDevice(deviceId);
      await refreshData();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? (err.data as { detail?: string })?.detail ?? err.message
          : t("revokeError")
      );
    } finally {
      setRevokingId(null);
    }
  };

  const hasRequiredParams = clientId && redirectUri && responseType === "code";

  const handleAllow = async () => {
    setError("");
    setLoading(true);
    try {
      const { redirect_url } = await createOAuth2Authorization({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: responseType,
        scope: scope || undefined,
        state: state || undefined,
        code_challenge: codeChallenge || undefined,
        code_challenge_method: codeChallengeMethod || undefined,
      });
      window.location.href = redirect_url;
    } catch (err) {
      setError(
        err instanceof ApiError
          ? (err.data as { detail?: string })?.detail ?? err.message
          : t("oauth2Error"),
      );
      setLoading(false);
    }
  };

  const handleDeny = () => {
    if (typeof window !== "undefined" && window.opener) {
      window.close();
    } else {
      router.replace("/");
    }
  };

  if (!isAuthenticated()) {
    return (
      <Container size="xs" py="xl">
        <div style={{ textAlign: "center", padding: "2rem" }}>
          {t("loading")}
        </div>
      </Container>
    );
  }

  if (!hasRequiredParams) {
    return (
      <Container size="xs" py="xl">
        <Card withBorder shadow="sm" radius="md" p="xl">
          <Text c="dimmed" ta="center">
            {t("oauth2Error")}: missing client_id, redirect_uri or response_type
          </Text>
        </Card>
      </Container>
    );
  }

  return (
    <Container size="xs" py="xl">
      <Card withBorder shadow="sm" radius="md" p="xl">
        <Stack>
          <Title order={3} ta="center">
            {t("oauth2ConsentTitle")}
          </Title>

          {sessionInfo && (
            <Text size="sm" c="dimmed" ta="center">
              {t("sessionsCount", {
                used: sessionInfo.used,
                limit: sessionInfo.limit,
              })}
            </Text>
          )}

          {sessionInfo && sessionInfo.used >= sessionInfo.limit && (
            <Stack gap="xs">
              <Notification color="orange" title={t("sessionLimitReached")}>
                {t("sessionLimitReachedDesc")}
              </Notification>
              {devices.length > 0 && (
                <Stack gap="xs">
                  <Text size="sm" fw={500}>
                    {t("revokeSessionToFreeSlot")}
                  </Text>
                  <List size="sm" spacing="xs">
                    {devices.map((d) => (
                      <List.Item
                        key={d.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 8,
                        }}
                      >
                        <span>
                          {d.device_name || d.application_name || d.hardware_id}
                        </span>
                        <Button
                          size="xs"
                          variant="light"
                          color="red"
                          loading={revokingId === d.id}
                          onClick={() => handleRevoke(d.id)}
                        >
                          {t("revoke")}
                        </Button>
                      </List.Item>
                    ))}
                  </List>
                </Stack>
              )}
            </Stack>
          )}

          {error && (
            <Notification color="red" onClose={() => setError("")}>
              {error}
            </Notification>
          )}

          <Group justify="center" mt="md">
            <Button variant="default" onClick={handleDeny}>
              {t("oauth2Deny")}
            </Button>
            <Button
              loading={loading}
              onClick={handleAllow}
              disabled={sessionInfo != null && sessionInfo.used >= sessionInfo.limit}
            >
              {t("oauth2Allow")}
            </Button>
          </Group>
        </Stack>
      </Card>
    </Container>
  );
}

export default function AuthorizePage() {
  const t = useTranslations("auth");
  return (
    <Suspense fallback={<Container size="xs" py="xl">{t("loading")}</Container>}>
      <AuthorizeForm />
    </Suspense>
  );
}
