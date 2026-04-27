"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { usePathname, useSearchParams } from "next/navigation";
import { Container, Loader, Stack, Text, Title, Center } from "@mantine/core";
import { useRouter } from "@/i18n/navigation";
import {
  isAuthenticated,
  getMe,
  checkEmailAuthMethods,
  type UserProfile,
} from "@/lib/api";
import {
  AccountSecurityLayout,
  AccountSecuritySection,
} from "@/components/account/AccountSecuritySection";

function AccountPageClient() {
  const t = useTranslations("accountPage");
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [hasPassword, setHasPassword] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [loading, setLoading] = useState(true);

  const refreshAuth = useCallback(async () => {
    const me = await getMe();
    const check = await checkEmailAuthMethods(me.email);
    setUser(me);
    if (check.is_blocked) {
      setIsBlocked(true);
      setHasPassword(false);
      return;
    }
    setIsBlocked(false);
    setHasPassword(check.auth_methods.includes("password"));
  }, []);

  useEffect(() => {
    if (!isAuthenticated()) {
      const search = searchParams.toString();
      const returnTo = search ? `${pathname}?${search}` : pathname;
      const nextParam = new URLSearchParams();
      if (returnTo && returnTo !== "/") {
        nextParam.set("next", returnTo);
      }
      const q = nextParam.toString();
      void router.replace("/login" + (q ? `?${q}` : ""));
      return;
    }
    setLoading(true);
    setLoadError(false);
    refreshAuth()
      .then(() => {})
      .catch(() => {
        setLoadError(true);
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [router, pathname, searchParams, refreshAuth]);

  if (loading) {
    return (
      <Container size="sm" py="xl">
        <Center mih={240}>
          <Loader />
        </Center>
      </Container>
    );
  }

  if (loadError || !user) {
    return (
      <Container size="sm" py="xl">
        <Text c="red" size="sm">
          {t("loadError")}
        </Text>
      </Container>
    );
  }

  return (
    <Container size="sm" py="xl">
      <Stack gap="lg">
        <div>
          <Title order={2}>{t("title")}</Title>
          <Text size="sm" c="dimmed" mt={4}>
            {user.email}
          </Text>
        </div>

        <AccountSecurityLayout title={t("securityTitle")} badge={t("securityBadge")}>
          <AccountSecuritySection
            hasPassword={hasPassword}
            isBlocked={isBlocked}
            onPasswordUpdated={refreshAuth}
          />
        </AccountSecurityLayout>
      </Stack>
    </Container>
  );
}

export default function AccountPage() {
  return (
    <Suspense
      fallback={
        <Container size="sm" py="xl">
          <Center mih={240}>
            <Loader />
          </Center>
        </Container>
      }
    >
      <AccountPageClient />
    </Suspense>
  );
}
