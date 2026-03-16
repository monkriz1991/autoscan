"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
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
} from "@mantine/core";
import { register, getCaptcha, ApiError } from "@/lib/api";

const DEFAULT_AFTER_AUTH = "/superadmin/dashboard";

function RegisterForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next") || DEFAULT_AFTER_AUTH;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [captcha, setCaptcha] = useState<{ a: number; b: number; c: number; token: string } | null>(null);

  const [loading, setLoading] = useState(false);
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

    try {
      setLoading(true);

      const data = await register({
        email,
        password1: password,
        password2,
        captcha_token: captcha.token,
        captcha_answer: answer,
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
        setError(messages.length > 0 ? messages.join(". ") : err.message);
      } else {
        setError(err instanceof Error ? err.message : t("registerError"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size="xs" py="xl">
      <Card withBorder shadow="sm" radius="md" p="xl">
        <Stack>
          <Title order={3} ta="center">
            {t("registerBusiness")}
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
            placeholder={t("passwordPlaceholder")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <PasswordInput
            label={t("password2")}
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
          />

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

          <Button fullWidth loading={loading} onClick={handleSubmit}>
            {t("createAccount")}
          </Button>
        </Stack>
      </Card>
    </Container>
  );
}

export default function RegisterPage() {
  const t = useTranslations("auth");
  return (
    <Suspense fallback={<Container size="xs" py="xl">{t("loading")}</Container>}>
      <RegisterForm />
    </Suspense>
  );
}
