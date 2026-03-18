"use client";

import { Suspense, useState, useEffect } from "react";
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
} from "@mantine/core";
import { connectToScannerApp, ApiError, isAuthenticated } from "@/lib/api";

function ConnectAppForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  const handleConnect = async () => {
    setError("");
    setLoading(true);
    try {
      await connectToScannerApp();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? (err.data as { detail?: string })?.detail ?? err.message
          : t("oauth2Error")
      );
      setLoading(false);
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

  return (
    <Container size="xs" py="xl">
      <Card withBorder shadow="sm" radius="md" p="xl">
        <Stack>
          <Title order={3} ta="center">
            {t("connectAppTitle")}
          </Title>
          <Text c="dimmed" ta="center" size="sm">
            {t("connectAppDesc")}
          </Text>

          {error && (
            <Notification color="red" onClose={() => setError("")}>
              {error}
            </Notification>
          )}

          <Button
            fullWidth
            loading={loading}
            onClick={handleConnect}
          >
            {t("connectAppButton")}
          </Button>
        </Stack>
      </Card>
    </Container>
  );
}

export default function ConnectAppPage() {
  const t = useTranslations("auth");
  return (
    <Suspense fallback={<Container size="xs" py="xl">{t("loading")}</Container>}>
      <ConnectAppForm />
    </Suspense>
  );
}
