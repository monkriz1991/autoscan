"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button, Container, Stack, Text, Title } from "@mantine/core";
import { useTranslations } from "next-intl";

/** Разрешённые цели ?next= для OAuth (тот же хост, путь authorize). */
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
    if (!rawNext || !decoded) {
      setErr(t("missingNext"));
      return;
    }
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
