"use client";

import { Suspense, useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
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
  Popover,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  login,
  ApiError,
  isAuthenticated,
  getMe,
  getGoogleOAuthRedirectUrl,
  POST_OAUTH_NEXT_STORAGE_KEY,
  getApiErrorMessage,
  requestMagicLink,
} from "@/lib/api";
import AuthPageShell from "@/components/auth/AuthPageShell";
import GoogleIcon from "@/components/auth/GoogleIcon";

const DEFAULT_AFTER_AUTH = "/cabinet/dashboard";

function LoginForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next") || DEFAULT_AFTER_AUTH;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState("");
  const [magicPopoverOpened, setMagicPopoverOpened] = useState(false);
  const [popoverEmail, setPopoverEmail] = useState("");
  const [magicSending, setMagicSending] = useState(false);
  const emailExistsNoticeShown = useRef(false);

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

  useEffect(() => {
    if (searchParams.get("notice") !== "email_exists") {
      return;
    }
    if (emailExistsNoticeShown.current) {
      return;
    }
    emailExistsNoticeShown.current = true;
    notifications.show({
      color: "blue",
      message: t("emailAlreadyExists"),
    });
    const q = new URLSearchParams();
    const n = searchParams.get("next");
    if (n) {
      q.set("next", n);
    }
    const qs = q.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }, [searchParams, pathname, router, t]);

  const sendMagicLinkTo = useCallback(
    async (targetEmail: string) => {
      const trimmed = targetEmail.trim().toLowerCase();
      if (!trimmed) {
        return;
      }
      setMagicSending(true);
      setError("");
      try {
        await requestMagicLink(trimmed);
        notifications.show({
          color: "teal",
          message: t("magicLinkSent", { email: trimmed }),
        });
        setMagicPopoverOpened(false);
        setPopoverEmail("");
      } catch (err) {
        setError(
          err instanceof ApiError ? getApiErrorMessage(err) : t("loginError"),
        );
      } finally {
        setMagicSending(false);
      }
    },
    [t],
  );

  const handleMagicLinkAnchorClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (trimmed) {
      void sendMagicLinkTo(trimmed);
    } else {
      setMagicPopoverOpened((o) => !o);
    }
  };

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

          <Button
            fullWidth
            size="md"
            leftSection={<GoogleIcon />}
            loading={googleLoading}
            onClick={handleGoogleLogin}
            styles={{
              root: {
                backgroundColor: "#fff",
                color: "#1f1f1f",
                border: "1px solid #747775",
              },
            }}
          >
            {t("loginWithGoogleFirst")}
          </Button>

          <Divider label={t("continueWithEmail")} labelPosition="center" />

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
            variant="outline"
            className="auth-page__btn-outline"
            loading={loading}
            onClick={handleSubmit}
          >
            {t("loginButton")}
          </Button>

          <Text size="xs" c="dimmed" ta="center">
            {t("forgotPasswordPrompt")}{" "}
            <Popover
              width={300}
              position="bottom"
              withArrow
              shadow="md"
              opened={magicPopoverOpened}
              onChange={setMagicPopoverOpened}
            >
              <Popover.Target>
                <Anchor size="xs" href="#" onClick={handleMagicLinkAnchorClick}>
                  {t("requestMagicLink")}
                </Anchor>
              </Popover.Target>
              <Popover.Dropdown>
                <Stack gap="sm">
                  <TextInput
                    label={t("email")}
                    value={popoverEmail}
                    onChange={(e) => setPopoverEmail(e.target.value)}
                    type="email"
                    autoComplete="email"
                  />
                  <Button
                    size="sm"
                    className="btn-cta-primary"
                    loading={magicSending}
                    onClick={() => void sendMagicLinkTo(popoverEmail)}
                  >
                    {t("requestMagicLink")}
                  </Button>
                </Stack>
              </Popover.Dropdown>
            </Popover>
          </Text>
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
