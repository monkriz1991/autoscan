"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card, Stack, Text, Button, Loader, Center } from "@mantine/core";
import { Link, useRouter } from "@/i18n/navigation";
import { verifyMagicLink, setTokens } from "@/lib/api";
import AuthPageShell from "@/components/auth/AuthPageShell";

const DEFAULT_AFTER_AUTH = "/cabinet/dashboard";

function MagicLinkInner() {
  const t = useTranslations("auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token || !token.trim()) {
      setError(t("magicLinkExpired"));
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const data = await verifyMagicLink(token);
        if (cancelled) {
          return;
        }
        setTokens(data.access, data.refresh);
        router.replace(DEFAULT_AFTER_AUTH);
      } catch (err) {
        if (cancelled) {
          return;
        }
        setError(t("magicLinkExpired"));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams, router, t]);

  if (error) {
    return (
      <AuthPageShell title={t("loginTitle")} subtitle={t("magicLinkExpired")}>
        <Card className="auth-card" radius="lg" p="xl" withBorder={false}>
          <Stack gap="md" align="center">
            <Text size="sm" c="red" ta="center">
              {error}
            </Text>
            <Button component={Link} href="/login" size="sm" className="btn-cta-primary">
              {t("magicLinkLoginEmail")}
            </Button>
          </Stack>
        </Card>
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell title={t("loginTitle")} subtitle={t("magicLinkLoading")}>
      <Card className="auth-card" radius="lg" p="xl" withBorder={false}>
        <Center py="lg">
          <Loader size="md" color="gray" />
        </Center>
        <Text ta="center" size="sm" c="dimmed">
          {t("magicLinkLoading")}
        </Text>
      </Card>
    </AuthPageShell>
  );
}

export default function MagicLinkPage() {
  const t = useTranslations("auth");
  return (
    <Suspense
      fallback={
        <AuthPageShell title={t("loginTitle")} subtitle={t("magicLinkLoading")}>
          <Card className="auth-card" radius="lg" p="xl" withBorder={false}>
            <Center py="lg">
              <Loader size="md" color="gray" />
            </Center>
          </Card>
        </AuthPageShell>
      }
    >
      <MagicLinkInner />
    </Suspense>
  );
}
