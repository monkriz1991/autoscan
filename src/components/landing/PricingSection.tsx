"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Box, Button, List, Stack, Text, Title } from "@mantine/core";
import { IconCheck } from "@tabler/icons-react";
import { getAndroidAppUrl } from "@/lib/app-store-urls";

export default function PricingSection() {
  const t = useTranslations("landing.pricing");
  const [annual, setAnnual] = useState(false);
  const androidUrl = getAndroidAppUrl();

  return (
    <Stack component="section" gap="xl" py={56} id="pricing" className="landing-pricing">
      <Box>
        <Title order={2} className="landing-section-title">
          {t("title")}
        </Title>
        <Text mt="sm" size="md" style={{ color: "var(--text-muted)" }}>
          {t("subtitle")}
        </Text>
      </Box>

      <Box className="landing-pricing__toggle" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          type="button"
          className={`landing-pricing__period ${!annual ? "landing-pricing__period--active" : ""}`}
          onClick={() => setAnnual(false)}
        >
          {t("monthly")}
        </button>
        <button
          type="button"
          className={`landing-pricing__period ${annual ? "landing-pricing__period--active" : ""}`}
          onClick={() => setAnnual(true)}
        >
          {t("annual")}
        </button>
        {annual ? (
          <Text component="span" size="xs" fw={700} className="landing-pricing__save-badge">
            {t("savePct")}
          </Text>
        ) : null}
      </Box>

      <Box className="landing-pricing__grid">
        <Box className="landing-pricing-card landing-pricing-card--free">
          <Title order={3} size="h4" mb="xs">
            {t("free.name")}
          </Title>
          <Text fw={800} className="landing-pricing-card__price" mb="md">
            {t("free.price")}
          </Text>
          <List spacing="sm" size="sm" icon={<IconCheck size={16} className="landing-pricing-icon-yes" />}>
            <List.Item>{t("free.f1")}</List.Item>
            <List.Item>{t("free.f2")}</List.Item>
            <List.Item>{t("free.f3")}</List.Item>
            <List.Item>{t("free.f4")}</List.Item>
            <List.Item>{t("free.f5")}</List.Item>
          </List>
          <List spacing="sm" size="sm" mt="sm" className="landing-pricing-list-no">
            <List.Item icon={<span className="landing-pricing-icon-no">✗</span>}>{t("free.n1")}</List.Item>
            <List.Item icon={<span className="landing-pricing-icon-no">✗</span>}>{t("free.n2")}</List.Item>
            <List.Item icon={<span className="landing-pricing-icon-no">✗</span>}>{t("free.n3")}</List.Item>
            <List.Item icon={<span className="landing-pricing-icon-no">✗</span>}>{t("free.n4")}</List.Item>
            <List.Item icon={<span className="landing-pricing-icon-no">✗</span>}>{t("free.n5")}</List.Item>
          </List>
          <Button
            component="a"
            href={androidUrl}
            target="_blank"
            rel="noopener noreferrer"
            mt="xl"
            radius="md"
            className="landing-pricing-cta landing-pricing-cta--outline"
            fullWidth
          >
            {t("free.cta")}
          </Button>
        </Box>

        <Box className="landing-pricing-card landing-pricing-card--pro">
          <Text className="landing-pricing-card__ribbon" size="xs" fw={700}>
            {t("pro.badge")}
          </Text>
          <Title order={3} size="h4" mb="xs">
            {t("pro.name")}
          </Title>
          <Box className="landing-pricing-card__price-wrap">
            <Text
              key={annual ? "y" : "m"}
              fw={800}
              className="landing-pricing-card__price landing-pricing-card__price--animated"
            >
              {annual ? t("pro.priceAnnual") : t("pro.priceMonthly")}
            </Text>
          </Box>
          <List spacing="sm" size="sm" icon={<IconCheck size={16} className="landing-pricing-icon-yes" />}>
            <List.Item>{t("pro.p1")}</List.Item>
            <List.Item>{t("pro.p2")}</List.Item>
            <List.Item>{t("pro.p3")}</List.Item>
            <List.Item>{t("pro.p4")}</List.Item>
            <List.Item>{t("pro.p5")}</List.Item>
            <List.Item>{t("pro.p6")}</List.Item>
            <List.Item>{t("pro.p7")}</List.Item>
            <List.Item>{t("pro.p8")}</List.Item>
            <List.Item>{t("pro.p9")}</List.Item>
          </List>
          <Link href="/marketing/pricing" style={{ textDecoration: "none", display: "block", marginTop: "var(--mantine-spacing-xl)" }}>
            <Button radius="md" className="landing-pricing-cta landing-pricing-cta--primary" fullWidth>
              {t("pro.cta")}
            </Button>
          </Link>
        </Box>
      </Box>

      <Text size="sm" ta="center" c="dimmed">
        {t("footnote")}
      </Text>
    </Stack>
  );
}
