"use client";

import { Suspense, useState, useEffect } from "react";
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
} from "@mantine/core";
import {
  createOAuth2Authorization,
  ApiError,
  isAuthenticated,
} from "@/lib/api";

function AuthorizeForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
  }, [router]);

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

          {error && (
            <Notification color="red" onClose={() => setError("")}>
              {error}
            </Notification>
          )}

          <Group justify="center" mt="md">
            <Button variant="default" onClick={handleDeny}>
              {t("oauth2Deny")}
            </Button>
            <Button loading={loading} onClick={handleAllow}>
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
