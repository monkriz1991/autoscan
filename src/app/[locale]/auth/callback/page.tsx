"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Container } from "@mantine/core";
import { useRouter } from "@/i18n/navigation";
import { setTokens, POST_OAUTH_NEXT_STORAGE_KEY } from "@/lib/api";

const DEFAULT_AFTER_AUTH = "/cabinet/dashboard";

/**
 * OAuth callback: два сценария.
 * 1) Google/Apple веб: бэкенд редиректит сюда с ?access_token=&refresh_token= (см. FRONTEND_CALLBACK_URL).
 * 2) OAuth2 сканера: ?code=&state= — пробрасываем в приложение сканера.
 */
const SCANNER_ORIGIN =
  typeof process !== "undefined"
    ? (process.env.NEXT_PUBLIC_SCANNER_APP_ORIGIN || "http://localhost:3000").replace(/\/$/, "")
    : "http://localhost:3000";

function isSafeInternalNextPath(path: string): boolean {
  const p = path.split("?")[0] || "";
  if (!p.startsWith("/") || p.startsWith("//")) return false;
  // Только пути с префиксом локали или относительные сегменты без локали (router добавит)
  return /^\/(en|de|ru|pl|it|es)\//.test(p) || /^\/(cabinet|account|business|login|register)(\/|$)/.test(p);
}

/** true если выполнен редирект. */
function redirectAfterSocialLogin(
  path: string,
  router: { replace: (href: string) => void },
): boolean {
  if (typeof window === "undefined") return false;
  if (!isSafeInternalNextPath(path)) return false;
  if (/^\/(en|de|ru|pl|it|es)\//.test(path)) {
    window.location.replace(path);
  } else {
    router.replace(path);
  }
  return true;
}

function OAuthCallbackInner() {
  const searchParams = useSearchParams();
  const params = useParams();
  const locale = typeof params.locale === "string" ? params.locale : "en";
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const accessToken = searchParams.get("access_token");
    const refreshToken = searchParams.get("refresh_token");
    const err = searchParams.get("error");

    // --- Соцсеть (Google/Apple): JWT от Django callback ---
    if (accessToken && refreshToken) {
      setTokens(accessToken, refreshToken);
      const rawNext = searchParams.get("next");
      if (rawNext) {
        try {
          const decoded = decodeURIComponent(rawNext);
          if (redirectAfterSocialLogin(decoded, router)) return;
        } catch {
          /* ignore */
        }
      }
      if (typeof window !== "undefined") {
        const stored = window.sessionStorage.getItem(POST_OAUTH_NEXT_STORAGE_KEY);
        if (stored) {
          window.sessionStorage.removeItem(POST_OAUTH_NEXT_STORAGE_KEY);
          if (redirectAfterSocialLogin(stored, router)) return;
        }
      }
      router.replace(DEFAULT_AFTER_AUTH);
      return;
    }

    if (err) {
      setError(searchParams.get("error_description") || err);
      return;
    }

    // --- Поток сканера: code + state ---
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (!code || !state) {
      setError(
        "Нет параметров входа. Ожидались access_token и refresh_token (Google/Apple) или code и state (сканер).",
      );
      return;
    }

    const usedRedirectUri =
      typeof window !== "undefined"
        ? `${window.location.origin}/${locale}/auth/callback`
        : `http://localhost:3001/${locale}/auth/callback`;

    const fwd = new URLSearchParams({
      code,
      state,
      used_redirect_uri: usedRedirectUri,
    });
    window.location.href = `${SCANNER_ORIGIN}/auth/callback?${fwd.toString()}`;
  }, [searchParams, locale, router]);

  if (error) {
    return (
      <Container size="xs" py="xl">
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <p style={{ color: "var(--mantine-color-red-6)", marginBottom: "1rem" }}>{error}</p>
          <a href={`/${locale}/login`} style={{ textDecoration: "underline", marginRight: "1rem" }}>
            На страницу входа
          </a>
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
        Перенаправление…
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
      <OAuthCallbackInner />
    </Suspense>
  );
}
