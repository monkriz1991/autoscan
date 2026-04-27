"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card, Stack, Text, Button, Anchor } from "@mantine/core";
import { Link, useRouter } from "@/i18n/navigation";
import { setTokens, POST_OAUTH_NEXT_STORAGE_KEY } from "@/lib/api";
import AuthPageShell from "@/components/auth/AuthPageShell";

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

/** Deep link desktop/Tauri: отдаём на ОС, чтобы сфокусировать/запустить нативное окно. */
const _scannerDeepLinkRaw =
  (typeof process !== "undefined" && (process.env.NEXT_PUBLIC_SCANNER_APP_DEEP_LINK || "").trim()) || "";
const SCANNER_DEEP_LINK = _scannerDeepLinkRaw ? _scannerDeepLinkRaw.replace(/\/$/, "") : "";

function isSafeAppDeepLink(href: string): boolean {
  const t = (href || "").trim();
  if (!t) return false;
  return /^obd-ai-scanner:\/\//i.test(t) || /^scanner:\/\//i.test(t);
}

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
  if (isSafeAppDeepLink(path)) {
    window.location.replace(path);
    return true;
  }
  if (!isSafeInternalNextPath(path)) return false;
  if (/^\/(en|de|ru|pl|it|es)\//.test(path)) {
    window.location.replace(path);
  } else {
    router.replace(path);
  }
  return true;
}

function OAuthCallbackInner() {
  const t = useTranslations("auth");
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
      setError(t("callbackMissingParams"));
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
  }, [searchParams, locale, router, t]);

  if (error) {
    return (
      <AuthPageShell title={t("oauth2Error")} subtitle={t("callbackErrorSubtitle")}>
        <Card className="auth-card" radius="lg" p="xl" withBorder={false}>
          <Stack gap="md" align="center">
            <Text size="sm" c="red" ta="center">
              {error}
            </Text>
            <Button component={Link} href="/login" size="sm" className="btn-cta-primary">
              {t("callbackBackLogin")}
            </Button>
            <Anchor
              href={SCANNER_DEEP_LINK || SCANNER_ORIGIN}
              size="sm"
              rel="noopener noreferrer"
              className="auth-page__footer-link"
            >
              {t("callbackOpenApp")}
            </Anchor>
          </Stack>
        </Card>
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell title={t("oauthEntry.title")} subtitle={t("callbackRedirecting")}>
      <Card className="auth-card" radius="lg" p="xl" withBorder={false}>
        <Text ta="center" size="sm" c="dimmed">
          {t("callbackRedirecting")}
        </Text>
      </Card>
    </AuthPageShell>
  );
}

export default function AuthCallbackPage() {
  const t = useTranslations("auth");
  return (
    <Suspense
      fallback={
        <AuthPageShell title={t("oauthEntry.title")} subtitle={t("loading")}>
          <Card className="auth-card" radius="lg" p="xl" withBorder={false}>
            <Text ta="center" size="sm" c="dimmed">
              {t("loading")}
            </Text>
          </Card>
        </AuthPageShell>
      }
    >
      <OAuthCallbackInner />
    </Suspense>
  );
}
