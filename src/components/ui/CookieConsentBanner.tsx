"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Anchor,
  Box,
  Button,
  Collapse,
  Group,
  Paper,
  Stack,
  Switch,
  Text,
} from "@mantine/core";
import { Link } from "@/i18n/navigation";
import {
  type CookieConsentState,
  readCookieConsent,
  writeCookieConsent,
  buildConsent,
  presetAcceptAll,
  presetRejectOptional,
} from "@/lib/cookieConsent";

/**
 * Баннер согласия на cookie: явный выбор (ЕС), уведомление и opt-out продажи/шеринга (США).
 */
export default function CookieConsentBanner() {
  const t = useTranslations("cookieConsent");
  const [hydrated, setHydrated] = useState(false);
  const [open, setOpen] = useState(false);
  const [customize, setCustomize] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [saleShareOptOut, setSaleShareOptOut] = useState(true);

  useEffect(() => {
    setHydrated(true);
    const existing = readCookieConsent();
    if (existing) {
      setOpen(false);
      return;
    }
    setOpen(true);
    setSaleShareOptOut(true);
  }, []);

  const closeWith = useCallback((state: CookieConsentState) => {
    writeCookieConsent(state);
    setOpen(false);
    setCustomize(false);
  }, []);

  const onAcceptAll = useCallback(() => {
    closeWith(presetAcceptAll());
  }, [closeWith]);

  const onRejectOptional = useCallback(() => {
    closeWith(presetRejectOptional());
  }, [closeWith]);

  const onSaveCustom = useCallback(() => {
    closeWith(
      buildConsent({
        analytics,
        marketing,
        saleShareOptOut,
      }),
    );
  }, [analytics, marketing, saleShareOptOut, closeWith]);

  if (!hydrated || !open) return null;

  return (
    <Box
      component="aside"
      role="dialog"
      aria-label={t("ariaLabel")}
      pos="fixed"
      bottom={0}
      left={0}
      right={0}
      p={{ base: "sm", sm: "md" }}
      pb="max(calc(0.75rem + env(safe-area-inset-bottom)), 0.75rem)"
      style={{ zIndex: 400 }}
    >
      <Paper
        shadow="xl"
        p={{ base: "sm", sm: "md" }}
        radius="md"
        withBorder
        maw={900}
        mx="auto"
      >
        <Stack gap="sm">
          <div>
            <Text fw={600} size="sm">
              {t("title")}
            </Text>
            <Text size="xs" c="dimmed" mt={4}>
              {t("summary")}
            </Text>
            <Text size="xs" c="dimmed" mt={6}>
              {t("euNote")}
            </Text>
            <Text size="xs" c="dimmed" mt={4}>
              {t("usNote")}
            </Text>
            <Anchor component={Link} href="/marketing/privacy" size="xs" mt={6} display="inline-block">
              {t("privacyLink")}
            </Anchor>
          </div>

          <Collapse in={customize}>
            <Stack gap="xs">
              <div>
                <Group justify="space-between" wrap="nowrap" gap="xs">
                  <Text size="xs" fw={500}>
                    {t("necessaryTitle")}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {t("alwaysOn")}
                  </Text>
                </Group>
                <Text size="xs" c="dimmed">
                  {t("necessaryDesc")}
                </Text>
              </div>
              <Switch
                size="xs"
                label={t("analyticsTitle")}
                description={t("analyticsDesc")}
                checked={analytics}
                onChange={(e) => setAnalytics(e.currentTarget.checked)}
              />
              <Switch
                size="xs"
                label={t("marketingTitle")}
                description={t("marketingDesc")}
                checked={marketing}
                onChange={(e) => setMarketing(e.currentTarget.checked)}
              />
              <Switch
                size="xs"
                label={t("saleOptOutTitle")}
                description={t("saleOptOutDesc")}
                checked={saleShareOptOut}
                onChange={(e) => setSaleShareOptOut(e.currentTarget.checked)}
              />
            </Stack>
          </Collapse>

          <Group gap="xs" wrap="wrap">
            <Button size="compact-sm" variant="filled" color="gray" onClick={onAcceptAll}>
              {t("acceptAll")}
            </Button>
            <Button size="compact-sm" variant="default" onClick={onRejectOptional}>
              {t("rejectOptional")}
            </Button>
            <Button
              size="compact-sm"
              variant="subtle"
              onClick={() => {
                setCustomize((c) => !c);
              }}
            >
              {customize ? t("hideCustomize") : t("customize")}
            </Button>
            {customize ? (
              <Button size="compact-sm" variant="light" onClick={onSaveCustom}>
                {t("save")}
              </Button>
            ) : null}
          </Group>
        </Stack>
      </Paper>
    </Box>
  );
}
