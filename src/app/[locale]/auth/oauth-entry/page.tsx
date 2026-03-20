"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { Container } from "@mantine/core";
import { useTranslations } from "next-intl";
import { Button, Container, Stack, Text, Title } from "@mantine/core";

/**
 * Шлюз для OAuth: Django редиректит сюда с ?next=/o/authorize/?params.
 * Парсим next, извлекаем OAuth-параметры и редиректим на /auth/authorize.
 * Если не залогинен — редирект на /login?next=текущая_страница.
 */
function OAuthEntryRedirect() {
  const router = useRouter();
function isAllowedNextTarget(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:" && u.protocol !== "http:") return false;
    const p = u.pathname;
    return p.includes("/o/authorize") || p.includes("/authorize/");
  } catch {
    return false;
  }
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

  useEffect(() => {
    const nextEncoded = searchParams.get("next");
    if (!nextEncoded) {
      router.replace("/");
    if (!rawNext || !decoded) {
      setErr(t("missingNext"));
      return;
    }
    try {
      const nextPath = decodeURIComponent(nextEncoded);
      // nextPath = "/o/authorize/?response_type=code&client_id=...&redirect_uri=..."
      const [path, query = ""] = nextPath.includes("?") ? nextPath.split("?", 2) : [nextPath, ""];
      if (!path.includes("/o/authorize")) {
        router.replace("/");
        return;
      }
      // Редирект на страницу согласия с теми же OAuth-параметрами
      router.replace(`/auth/authorize?${query}`);
    } catch {
      router.replace("/");
    }
  }, [searchParams, router]);
    if (!isAllowedNextTarget(decoded)) {
      setErr(t("invalidNext"));
      return;
    }
    window.location.replace(decoded);
  }, [rawNext, decoded, t]);

  return (
    <Container size="sm" py="xl">
      <Stack gap="md">
        <Title order={3}>{t("title")}</Title>
        {err ? <Text c="red">{err}</Text> : <Text c="dimmed">{t("redirectAuthorize")}</Text>}
        {decoded && !err && (
          <Button component="a" href={decoded} size="md">
            {t("openManually")}
          </Button>
        )}
      </Stack>
    <Container size="xs" py="xl">
      <div style={{ textAlign: "center", padding: "2rem" }}>
        Перенаправление…
      </div>
    </Container>
  );
}

export default function OAuthEntryPage() {
  const t = useTranslations("auth.oauthEntry");
  return (
    <Suspense fallback={<Container size="xs" py="xl"><div style={{ textAlign: "center" }}>Загрузка…</div></Container>}>
      <OAuthEntryRedirect />
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
