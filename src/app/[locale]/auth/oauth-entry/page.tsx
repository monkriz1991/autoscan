"use client";

/**
 * Мост: редирект на полный URL из ?next= (обычно Django /o/authorize/?...).
 * Без этого пользователь зависает здесь и не доходит до obd-ai-scanner://auth/callback.
 * Сессию Django запрашивает сама страница /o/authorize/ — отдельный JWT Next не обязателен.
 */
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button, Container, Stack, Text, Title } from "@mantine/core";

function isAllowedAuthorizePath(pathname: string): boolean {
  return pathname.includes("/o/authorize") || pathname.includes("/authorize/");
}

/** Абсолютный URL для редиректа; относительный `/o/authorize/?...` от Django — через origin. */
function resolveOAuthNextTarget(decoded: string): string | null {
  const trimmed = decoded.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("https://") || trimmed.startsWith("http://")) {
    try {
      const u = new URL(trimmed);
      if (u.protocol !== "https:" && u.protocol !== "http:") return null;
      if (!isAllowedAuthorizePath(u.pathname)) return null;
      return trimmed;
    } catch {
      return null;
    }
  }

  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    const pathOnly = trimmed.split("?")[0]?.split("#")[0] ?? "";
    if (!isAllowedAuthorizePath(pathOnly)) return null;
    if (typeof window === "undefined") return null;
    return `${window.location.origin}${trimmed}`;
  }

  return null;
}

function OAuthEntryInner() {
  const t = useTranslations("auth.oauthEntry");
  const searchParams = useSearchParams();
  const rawNext = searchParams.get("next");
  const decoded = useMemo(() => {
    if (!rawNext) return "";
    try {
      return decodeURIComponent(rawNext);
    } catch {
      return "";
    }
  }, [rawNext]);

  const [err, setErr] = useState("");

  const resolvedTarget = useMemo(() => resolveOAuthNextTarget(decoded), [decoded]);

  useEffect(() => {
    if (!rawNext || !decoded) {
      setErr(t("missingNext"));
      return;
    }
    if (!resolvedTarget) {
      setErr(t("invalidNext"));
      return;
    }
    setErr("");
    window.location.replace(resolvedTarget);
  }, [rawNext, decoded, resolvedTarget, t]);

  return (
    <Container size="sm" py="xl">
      <Stack gap="md">
        <Title order={3}>{t("title")}</Title>
        {err ? <Text c="red">{err}</Text> : <Text c="dimmed">{t("redirectAuthorize")}</Text>}
        {resolvedTarget && !err && (
          <Button component="a" href={resolvedTarget} size="md">
            {t("openManually")}
          </Button>
        )}
      </Stack>
    </Container>
  );
}

export default function OAuthEntryPage() {
  const t = useTranslations("auth.oauthEntry");
  return (
    <Suspense
      fallback={
        <Container size="sm" py="xl">
          <Text>{t("loading")}</Text>
        </Container>
      }
    >
      <OAuthEntryInner />
    </Suspense>
  );
}
