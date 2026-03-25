"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Container } from "@mantine/core";

/**
 * OAuth callback: backend редиректит сюда (redirect_uri=3001).
 * Auth UI и сканер на одном порту — пробрасываем code и state в сканер.
 * Сканер должен быть на NEXT_PUBLIC_SCANNER_APP_ORIGIN (например 3000).
 */
const SCANNER_ORIGIN =
  typeof process !== "undefined"
    ? (process.env.NEXT_PUBLIC_SCANNER_APP_ORIGIN || "http://localhost:3000").replace(/\/$/, "")
    : "http://localhost:3000";

function OAuthCallbackRedirect() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const err = searchParams.get("error");

    if (err) {
      setError(searchParams.get("error_description") || err);
      return;
    }

    if (!code || !state) {
      setError("Нет кода или state. Войдите заново через приложение сканера.");
      return;
    }

    // redirect_uri, который использовался в OAuth (без locale)
    const usedRedirectUri =
      typeof window !== "undefined"
        ? `${window.location.origin}/auth/callback`
        : "http://localhost:3001/auth/callback";

    const params = new URLSearchParams({
      code,
      state,
      used_redirect_uri: usedRedirectUri,
    });
    window.location.href = `${SCANNER_ORIGIN}/auth/callback?${params.toString()}`;
  }, [searchParams]);

  if (error) {
    return (
      <Container size="xs" py="xl">
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <p style={{ color: "var(--mantine-color-red-6)", marginBottom: "1rem" }}>{error}</p>
          <a href={SCANNER_ORIGIN} style={{ textDecoration: "underline" }}>
            Вернуться в приложение
          </a>
        </div>
      </Container>
    );
  }

  return (
    <Container size="xs" py="xl">
      <div style={{ textAlign: "center", padding: "2rem" }}>
        Перенаправление в приложение…
      </div>
    </Container>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <Container size="xs" py="xl">
          <div style={{ textAlign: "center" }}>Загрузка…</div>
        </Container>
      }
    >
      <OAuthCallbackRedirect />
    </Suspense>
  );
}
