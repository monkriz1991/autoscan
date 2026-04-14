"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import {
  Anchor,
  Card,
  TextInput,
  PasswordInput,
  Button,
  Stack,
  Notification,
  Loader,
  Center,
  Divider,
  Text,
} from "@mantine/core";
import {
  login,
  ApiError,
  isAuthenticated,
  getMe,
  getGoogleOAuthRedirectUrl,
  POST_OAUTH_NEXT_STORAGE_KEY,
  getApiErrorMessage,
} from "@/lib/api";
import AuthPageShell from "@/components/auth/AuthPageShell";

const DEFAULT_AFTER_AUTH = "/cabinet/dashboard";

function LoginForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next") || DEFAULT_AFTER_AUTH;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
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

  const handleGoogleLogin = async () => {
    setError("");
    setGoogleLoading(true);
    try {
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(POST_OAUTH_NEXT_STORAGE_KEY, nextUrl);
      }
      const url = await getGoogleOAuthRedirectUrl();
      window.location.href = url;
    } catch (err) {
      setGoogleLoading(false);
      setError(
        err instanceof ApiError ? getApiErrorMessage(err) : t("googleLoginError"),
      );
    }
  };

  const registerHref = `/register?next=${encodeURIComponent(nextUrl)}`;

  if (checkingSession) {
    return (
      <AuthPageShell title={t("loginTitle")} subtitle={t("loginSubtitle")}>
        <Card className="auth-card" radius="lg" p="xl" withBorder={false}>
          <Center py="lg">
            <Loader size="lg" color="gray" />
          </Center>
        </Card>
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell
      title={t("loginTitle")}
      subtitle={t("loginSubtitle")}
      footer={
        <Text component="span" size="sm" c="inherit">
          {t("noAccount")}{" "}
          <Anchor component={Link} href={registerHref} size="sm" inherit>
            {t("linkRegister")}
          </Anchor>
        </Text>
      }
    >
      <Card className="auth-card" radius="lg" p="xl" withBorder={false}>
        <Stack gap="md">
          {error && (
            <Notification color="red" onClose={() => setError("")}>
              {error}
            </Notification>
          )}

          <TextInput
            label={t("email")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />

          <PasswordInput
            label={t("password")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />

          <Button
            fullWidth
            size="md"
            className="btn-cta-primary"
            loading={loading}
            onClick={handleSubmit}
          >
            {t("loginButton")}
          </Button>

          <Divider label={t("loginDividerOr")} labelPosition="center" />

          <Button
            fullWidth
            size="md"
            variant="outline"
            className="auth-page__btn-outline"
            loading={googleLoading}
            onClick={handleGoogleLogin}
          >
            {t("loginWithGoogle")}
          </Button>
        </Stack>
      </Card>
    </AuthPageShell>
  );
}

export default function LoginPage() {
  const t = useTranslations("auth");
  return (
    <Suspense
      fallback={
        <AuthPageShell title={t("loading")}>
          <Card className="auth-card" radius="lg" p="xl" withBorder={false}>
            <Center py="lg">
              <Loader size="md" color="gray" />
            </Center>
          </Card>
        </AuthPageShell>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
