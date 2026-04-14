"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import {
  Anchor,
  Card,
  Checkbox,
  Notification,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Button,
  Divider,
} from "@mantine/core";
import {
  register,
  getCaptcha,
  ApiError,
  getGoogleOAuthRedirectUrl,
  POST_OAUTH_NEXT_STORAGE_KEY,
  getApiErrorMessage,
} from "@/lib/api";
import AuthPageShell from "@/components/auth/AuthPageShell";

const DEFAULT_AFTER_AUTH = "/cabinet/dashboard";

function RegisterForm() {
  const t = useTranslations("auth");
  const tFooter = useTranslations("footer");
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next") || DEFAULT_AFTER_AUTH;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [captcha, setCaptcha] = useState<{ a: number; b: number; c: number; token: string } | null>(null);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [acceptDisclaimer, setAcceptDisclaimer] = useState(false);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const loadCaptcha = useCallback(async () => {
    try {
      const data = await getCaptcha();
      setCaptcha(data);
      setCaptchaAnswer("");
    } catch {
      setError(t("captchaLoadError"));
    }
  }, [t]);

  useEffect(() => {
    loadCaptcha();
  }, [loadCaptcha]);

  const handleSubmit = async () => {
    setError("");

    if (!email || !password || !password2) {
      setError(t("fillAll"));
      return;
    }

    if (password.length < 8) {
      setError(t("passwordMin"));
      return;
    }

    if (password !== password2) {
      setError(t("passwordMismatch"));
      return;
    }

    const answer = parseInt(captchaAnswer, 10);
    if (!captcha || isNaN(answer)) {
      setError(t("solveCaptcha"));
      return;
    }

    if (answer !== captcha.a + captcha.b + captcha.c) {
      setError(t("captchaWrong"));
      loadCaptcha();
      return;
    }

    if (!acceptTerms || !acceptPrivacy || !acceptDisclaimer) {
      setError(t("legalMustAcceptAll"));
      return;
    }

    try {
      setLoading(true);

      const data = await register({
        email,
        password1: password,
        password2,
        captcha_token: captcha.token,
        captcha_answer: answer,
        accept_terms: true,
        accept_privacy_policy: true,
        accept_disclaimer: true,
      });

      if (data.access && data.refresh) {
        router.push(nextUrl);
      } else if (data.detail) {
        setError(data.detail);
      } else {
        setError(t("registerSuccess"));
      }
    } catch (err) {
      if (err instanceof ApiError) {
        const d = err.data as Record<string, unknown>;
        if (d?.captcha_answer) {
          loadCaptcha();
        }
        const messages: string[] = [];
        if (typeof d?.detail === "string") {
          messages.push(d.detail);
        } else if (typeof d?.detail === "object" && d.detail !== null) {
          Object.values(d.detail as Record<string, string[]>).flat().forEach((m) =>
            messages.push(String(m)),
          );
        }
        for (const [key, val] of Object.entries(d)) {
          if (key === "detail") continue;
          if (Array.isArray(val)) {
            val.forEach((m) => messages.push(String(m)));
          } else if (typeof val === "string") {
            messages.push(val);
          }
        }
        setError(messages.length > 0 ? messages.join(". ") : err.message);
      } else {
        setError(err instanceof Error ? err.message : t("registerError"));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setError("");
    if (!acceptTerms || !acceptPrivacy || !acceptDisclaimer) {
      setError(t("legalMustAcceptAll"));
      return;
    }
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

  const loginHref = `/login?next=${encodeURIComponent(nextUrl)}`;

  return (
    <AuthPageShell
      title={t("registerBusiness")}
      subtitle={t("registerSubtitle")}
      footer={
        <Text component="span" size="sm" c="inherit">
          {t("haveAccount")}{" "}
          <Anchor component={Link} href={loginHref} size="sm" inherit>
            {t("linkLogin")}
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
            placeholder={t("passwordPlaceholder")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />

          <PasswordInput
            label={t("password2")}
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            autoComplete="new-password"
          />

          <Stack gap="xs">
            <Checkbox
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.currentTarget.checked)}
              label={
                <Text size="sm" component="span">
                  {t("legalReadDoc")}{" "}
                  <Anchor component={Link} href="/marketing/terms" size="sm" inherit underline="always">
                    {tFooter("terms")}
                  </Anchor>
                </Text>
              }
            />
            <Checkbox
              checked={acceptPrivacy}
              onChange={(e) => setAcceptPrivacy(e.currentTarget.checked)}
              label={
                <Text size="sm" component="span">
                  {t("legalReadDoc")}{" "}
                  <Anchor component={Link} href="/marketing/privacy" size="sm" inherit underline="always">
                    {tFooter("privacy")}
                  </Anchor>
                </Text>
              }
            />
            <Checkbox
              checked={acceptDisclaimer}
              onChange={(e) => setAcceptDisclaimer(e.currentTarget.checked)}
              label={
                <Text size="sm" component="span">
                  {t("legalReadDoc")}{" "}
                  <Anchor component={Link} href="/marketing/disclaimer" size="sm" inherit underline="always">
                    {tFooter("disclaimer")}
                  </Anchor>
                </Text>
              }
            />
          </Stack>

          {captcha && (
            <TextInput
              label={t("captchaLabel", { a: captcha.a, b: captcha.b, c: captcha.c })}
              placeholder={t("captchaPlaceholder")}
              type="number"
              value={captchaAnswer}
              onChange={(e) => setCaptchaAnswer(e.target.value)}
              min={1}
              max={27}
            />
          )}

          <Button
            fullWidth
            size="md"
            className="btn-cta-primary"
            loading={loading}
            onClick={handleSubmit}
          >
            {t("createAccount")}
          </Button>

          <Divider label={t("loginDividerOr")} labelPosition="center" />

          <Button
            fullWidth
            size="md"
            variant="outline"
            className="auth-page__btn-outline"
            loading={googleLoading}
            onClick={handleGoogleRegister}
          >
            {t("registerWithGoogle")}
          </Button>
        </Stack>
      </Card>
    </AuthPageShell>
  );
}

export default function RegisterPage() {
  const t = useTranslations("auth");
  return (
    <Suspense
      fallback={
        <AuthPageShell title={t("loading")}>
          <Card className="auth-card" radius="lg" p="xl" withBorder={false}>
            <Text ta="center" size="sm" c="dimmed">
              {t("loading")}
            </Text>
          </Card>
        </AuthPageShell>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
