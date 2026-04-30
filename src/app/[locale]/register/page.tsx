"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import {
  Anchor,
  Box,
  Card,
  Checkbox,
  Notification,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Button,
  Divider,
  Loader,
  Center,
  LoadingOverlay,
} from "@mantine/core";
import { IconArrowLeft, IconArrowRight } from "@tabler/icons-react";
import {
  register,
  getCaptcha,
  checkEmailExists,
  ApiError,
  getGoogleOAuthRedirectUrl,
  POST_OAUTH_NEXT_STORAGE_KEY,
  getApiErrorMessage,
} from "@/lib/api";
import AuthPageShell from "@/components/auth/AuthPageShell";
import GoogleIcon from "@/components/auth/GoogleIcon";
import PasswordStrength from "@/components/auth/PasswordStrength";

const DEFAULT_AFTER_AUTH = "/cabinet/dashboard";

function passwordMeetsRules(p: string): boolean {
  return p.length >= 8 && /\d/.test(p) && /[A-Z]/.test(p);
}

function RegisterForm() {
  const t = useTranslations("auth");
  const tFooter = useTranslations("footer");
  const tCheckout = useTranslations("checkout");
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next") || DEFAULT_AFTER_AUTH;

  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [captcha, setCaptcha] = useState<{
    a: number;
    b: number;
    c: number;
    token: string;
  } | null>(null);
  const [captchaBooting, setCaptchaBooting] = useState(false);
  const [acceptAll, setAcceptAll] = useState(false);

  const [loading, setLoading] = useState(false);
  const [emailCheckLoading, setEmailCheckLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  /** Синхронная защита от двойного вызова register до первого ре-рендера с loading. */
  const registerSubmitLockRef = useRef(false);

  const loadCaptcha = useCallback(async () => {
    setCaptchaBooting(true);
    try {
      const data = await getCaptcha();
      setCaptcha(data);
      setCaptchaAnswer("");
    } catch {
      setCaptcha(null);
      setError(t("captchaLoadError"));
    } finally {
      setCaptchaBooting(false);
    }
  }, [t]);

  /* Капча на шаге 2: загружаем сразу при входе на экран пароля. */
  useEffect(() => {
    if (step !== 2) {
      return;
    }
    void loadCaptcha();
  }, [step, loadCaptcha]);

  const applyRegisterApiError = useCallback(
    async (err: ApiError) => {
      const d = err.data as Record<string, unknown>;
      const cap = d.captcha_answer;
      const needsCaptcha =
        cap != null && (Array.isArray(cap) ? cap.length > 0 : true);
      if (needsCaptcha) {
        await loadCaptcha();
      }
      const messages: string[] = [];
      if (typeof d.detail === "string") {
        messages.push(d.detail);
      } else if (typeof d.detail === "object" && d.detail !== null) {
        Object.values(d.detail as Record<string, string[]>)
          .flat()
          .forEach((m) => messages.push(String(m)));
      }
      for (const [key, val] of Object.entries(d)) {
        if (key === "detail") {
          continue;
        }
        if (Array.isArray(val)) {
          val.forEach((m) => messages.push(String(m)));
        } else if (typeof val === "string") {
          messages.push(val);
        }
      }
      setError(messages.length > 0 ? messages.join(". ") : err.message);
    },
    [loadCaptcha],
  );

  const tryRegister = useCallback(async () => {
    if (registerSubmitLockRef.current) {
      return;
    }
    registerSubmitLockRef.current = true;
    setLoading(true);
    try {
      setError("");
      if (!passwordMeetsRules(password)) {
        setError(t("passwordMin"));
        return;
      }
      if (!acceptAll) {
        setError(t("legalMustAcceptAll"));
        return;
      }

      if (!captcha) {
        setError(t("solveCaptcha"));
        return;
      }

      const captchaAnswerNum = parseInt(captchaAnswer, 10);
      if (Number.isNaN(captchaAnswerNum)) {
        setError(t("solveCaptcha"));
        return;
      }
      if (captchaAnswerNum !== captcha.a + captcha.b + captcha.c) {
        setError(t("captchaWrong"));
        void loadCaptcha();
        return;
      }

      const payload = {
        email,
        password1: password,
        password2: password,
        accept_terms: true,
        accept_privacy_policy: true,
        accept_disclaimer: true,
        captcha_token: captcha.token,
        captcha_answer: captchaAnswerNum,
      };
      const data = await register(payload);

      if (data.access && data.refresh) {
        router.push(nextUrl);
      } else if (data.detail) {
        setError(data.detail);
      } else {
        setError(t("registerSuccess"));
      }
    } catch (err) {
      if (err instanceof ApiError) {
        await applyRegisterApiError(err);
      } else {
        setError(err instanceof Error ? err.message : t("registerError"));
      }
    } finally {
      registerSubmitLockRef.current = false;
      setLoading(false);
    }
  }, [
    email,
    password,
    acceptAll,
    captcha,
    captchaAnswer,
    router,
    nextUrl,
    t,
    loadCaptcha,
    applyRegisterApiError,
  ]);

  const handleSubmit = async () => {
    await tryRegister();
  };

  const handleEmailContinue = async () => {
    setError("");
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setError(t("fillAll"));
      return;
    }
    setEmailCheckLoading(true);
    try {
      const exists = await checkEmailExists(trimmed);
      if (exists) {
        router.push(
          `/login?next=${encodeURIComponent(nextUrl)}&notice=email_exists`,
        );
        return;
      }
      setStep(2);
    } catch (err) {
      setError(
        err instanceof ApiError ? getApiErrorMessage(err) : t("registerError"),
      );
    } finally {
      setEmailCheckLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setError("");
    setGoogleLoading(true);
    try {
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(POST_OAUTH_NEXT_STORAGE_KEY, nextUrl);
      }
      const url = await getGoogleOAuthRedirectUrl(nextUrl);
      window.location.href = url;
    } catch (err) {
      setGoogleLoading(false);
      setError(
        err instanceof ApiError ? getApiErrorMessage(err) : t("googleLoginError"),
      );
    }
  };

  const loginHref = `/login?next=${encodeURIComponent(nextUrl)}`;

  const shellTitle = step === 1 ? t("step1Title") : t("step2Title");

  return (
    <AuthPageShell
      title={shellTitle}
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
        <Box pos="relative">
          <LoadingOverlay
            visible={loading}
            zIndex={400}
            overlayProps={{ radius: "lg", blur: 2 }}
          />
          <Stack gap="md">
          {error && (
            <Notification color="red" onClose={() => setError("")}>
              {error}
            </Notification>
          )}

          {step === 1 ? (
            <>
              <Button
                fullWidth
                size="md"
                leftSection={<GoogleIcon />}
                loading={googleLoading}
                onClick={handleGoogleRegister}
                styles={{
                  root: {
                    backgroundColor: "#fff",
                    color: "#1f1f1f",
                    border: "1px solid #747775",
                  },
                }}
              >
                {t("registerWithGoogle")}
              </Button>

              <Divider label={t("loginDividerOr")} labelPosition="center" />

              <TextInput
                label={t("email")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />

              <Button
                fullWidth
                size="md"
                className="btn-cta-primary"
                loading={emailCheckLoading}
                rightSection={<IconArrowRight size={18} />}
                onClick={() => void handleEmailContinue()}
              >
                {t("continueButton")}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="subtle"
                size="sm"
                px={0}
                leftSection={<IconArrowLeft size={18} />}
                disabled={loading}
                onClick={() => {
                  setStep(1);
                  setError("");
                  setCaptcha(null);
                  setCaptchaAnswer("");
                }}
              >
                {t("backButton")}
              </Button>

              <PasswordInput
                label={t("password")}
                placeholder={t("passwordPlaceholder")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />

              <PasswordStrength password={password} />

              <Checkbox
                checked={acceptAll}
                onChange={(e) => setAcceptAll(e.currentTarget.checked)}
                label={
                  <Text size="sm" component="span">
                    {t("acceptAllLabel")}{" "}
                    <Anchor component={Link} href="/terms" size="sm" inherit underline="always">
                      {tFooter("terms")}
                    </Anchor>
                    ,{" "}
                    <Anchor component={Link} href="/privacy" size="sm" inherit underline="always">
                      {tFooter("privacy")}
                    </Anchor>{" "}
                    {t("acceptAllConjunction")}{" "}
                    <Anchor component={Link} href="/marketing/disclaimer" size="sm" inherit underline="always">
                      {tFooter("disclaimer")}
                    </Anchor>
                  </Text>
                }
              />

              {captchaBooting && !captcha ? (
                <Center py="sm">
                  <Loader size="sm" color="gray" />
                </Center>
              ) : captcha ? (
                <TextInput
                  label={t("captchaLabel", {
                    a: captcha.a,
                    b: captcha.b,
                    c: captcha.c,
                  })}
                  placeholder={t("captchaPlaceholder")}
                  type="number"
                  value={captchaAnswer}
                  onChange={(e) => setCaptchaAnswer(e.target.value)}
                  min={1}
                  max={27}
                />
              ) : (
                <Button variant="light" size="sm" onClick={() => void loadCaptcha()}>
                  {tCheckout("retry")}
                </Button>
              )}

              <Button
                fullWidth
                size="md"
                className="btn-cta-primary"
                loading={loading}
                disabled={loading || captchaBooting || !captcha}
                onClick={() => void handleSubmit()}
              >
                {t("createAccount")}
              </Button>
            </>
          )}
        </Stack>
        </Box>
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
