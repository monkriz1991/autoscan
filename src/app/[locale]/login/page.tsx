"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  Container,
  Card,
  Title,
  TextInput,
  PasswordInput,
  Button,
  Stack,
  Notification,
  Loader,
  Center,
} from "@mantine/core";
import { login, ApiError, isAuthenticated, getMe } from "@/lib/api";

const DEFAULT_AFTER_AUTH = "/superadmin/dashboard";

function LoginForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next") || DEFAULT_AFTER_AUTH;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated()) {
      setCheckingSession(false);
      return;
    }
    getMe()
      .then(() => {
        const pathOnly = nextUrl.split("?")[0];
        const search = nextUrl.includes("?") ? nextUrl.slice(nextUrl.indexOf("?")) : "";
        if (/^\/(en|de|ru|pl|it|es)(\/|$)/.test(pathOnly)) {
          window.location.href = nextUrl;
        } else {
          router.replace(pathOnly + search);
        }
      })
      .catch(() => {
        setCheckingSession(false);
      });
  }, [router, nextUrl]);

  const handleSubmit = async () => {
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      const pathOnly = nextUrl.split("?")[0];
      if (/^\/(en|de|ru|pl|it|es)(\/|$)/.test(pathOnly)) {
        window.location.href = nextUrl;
      } else {
        router.push(nextUrl);
      }
    } catch (err) {
      setError(
        err instanceof ApiError
          ? (err.data as { detail?: string })?.detail || err.message
          : t("loginError"),
      );
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <Container size="xs" py="xl">
        <Center py="xl">
          <Loader size="lg" />
        </Center>
      </Container>
    );
  }

  return (
    <Container size="xs" py="xl">
      <Card withBorder shadow="sm" radius="md" p="xl">
        <Stack>
          <Title order={3} ta="center">
            {t("loginTitle")}
          </Title>

          {error && (
            <Notification color="red" onClose={() => setError("")}>
              {error}
            </Notification>
          )}

          <TextInput
            label={t("email")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <PasswordInput
            label={t("password")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button fullWidth loading={loading} onClick={handleSubmit}>
            {t("loginButton")}
          </Button>
        </Stack>
      </Card>
    </Container>
  );
}

export default function LoginPage() {
  const t = useTranslations("auth");
  return (
    <Suspense fallback={<Container size="xs" py="xl">{t("loading")}</Container>}>
      <LoginForm />
    </Suspense>
  );
}
