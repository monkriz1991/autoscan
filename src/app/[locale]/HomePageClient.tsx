"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { Box, Button, SimpleGrid, Stack, Text, Title, ThemeIcon, Card } from "@mantine/core";
import {
  IconBrain,
  IconActivity,
  IconBluetoothConnected,
  IconDeviceDesktopAnalytics,
  IconCheck,
  IconSettingsAutomation,
} from "@tabler/icons-react";
import { isAuthenticated } from "@/lib/api";

function HeroSection({ authenticated }: { authenticated: boolean }) {
  const t = useTranslations("home");
  return (
    <Box
      className="car-hero home-hero"
      style={{
        width: "100vw",
        position: "relative",
        left: "50%",
        right: "50%",
        marginLeft: "-50vw",
        marginRight: "-50vw",
        marginTop: "-40px",
        padding: "72px 24px 64px",
        overflow: "hidden",
      }}
    >
      <Box
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 28,
          textAlign: "center",
        }}
      >
        <Text
          size="xs"
          tt="uppercase"
          fw={600}
          c="dimmed"
          style={{ letterSpacing: "0.18em" }}
        >
          {t("brand")}
        </Text>

        <Box
          className="home-hero-media"
          style={{
            width: "min(920px, 100%)",
            position: "relative",
            aspectRatio: "16 / 6",
            maxHeight: 320,
          }}
        >
          <Image
            src="/car-hero.png"
            alt={t("heroTitle")}
            fill
            className="home-hero-car-image"
            sizes="(max-width: 960px) 100vw, 920px"
            style={{ objectFit: "contain" }}
            priority
          />
          <Box aria-hidden className="home-hero-car-fade" />
        </Box>

        <Stack gap={10} align="center">
          <Title
            order={1}
            style={{
              fontSize: "clamp(2rem, 4vw, 3.6rem)",
              fontWeight: 300,
              letterSpacing: "-0.04em",
              lineHeight: 1.05,
            }}
          >
            {t("heroTitle")}
          </Title>
          <Text
            maw={760}
            c="dimmed"
            style={{
              fontSize: "clamp(1rem, 1.5vw, 1.125rem)",
              lineHeight: 1.7,
            }}
          >
            {t("heroSubtitle")}
          </Text>
        </Stack>

        <Box style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          {authenticated ? (
            <Link href="/cabinet/dashboard" style={{ textDecoration: "none" }}>
              <Button className="btn-metallic" color="silver" radius="xl" size="md" px="xl">
                {t("heroStart")}
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/register" style={{ textDecoration: "none" }}>
                <Button className="btn-metallic" color="silver" radius="xl" size="md" px="xl">
                  {t("ctaButton")}
                </Button>
              </Link>
              <Link href="/marketing/pricing" style={{ textDecoration: "none" }}>
                <Button
                  className="btn-metallic btn-metallic-outline"
                  color="silver"
                  variant="default"
                  radius="xl"
                  size="md"
                  px="xl"
                >
                  {t("heroPricing")}
                </Button>
              </Link>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
}

function FeaturesSection() {
  const t = useTranslations("home");

  return (
    <Stack gap={32} py="xl" className="home-features-section">
      <Title
        order={2}
        ta="center"
        className="home-features-title"
        style={{ fontWeight: 400, letterSpacing: "-0.03em" }}
      >
        {t("featuresTitle")}
      </Title>

      <SimpleGrid cols={{ base: 1, md: 3 }} spacing="xl">
        <Card withBorder shadow="sm" radius="md" padding="xl" className="home-feature-card">
          <ThemeIcon
            size={56}
            radius="md"
            variant="light"
            color="blue"
            mb="sm"
            className="home-feature-icon"
          >
            <IconBrain size={32} stroke={1.5} />
          </ThemeIcon>
          <Text size="lg" fw={600} mb="xs" className="home-feature-card-title">
            {t("feature1Title")}
          </Text>
          <Text size="sm" className="home-feature-card-desc">
            {t("feature1Desc")}
          </Text>
        </Card>

        <Card withBorder shadow="sm" radius="md" padding="xl" className="home-feature-card">
          <ThemeIcon
            size={56}
            radius="md"
            variant="light"
            color="green"
            mb="sm"
            className="home-feature-icon"
          >
            <IconActivity size={32} stroke={1.5} />
          </ThemeIcon>
          <Text size="lg" fw={600} mb="xs" className="home-feature-card-title">
            {t("feature2Title")}
          </Text>
          <Text size="sm" className="home-feature-card-desc">
            {t("feature2Desc")}
          </Text>
        </Card>

        <Card withBorder shadow="sm" radius="md" padding="xl" className="home-feature-card">
          <ThemeIcon
            size={56}
            radius="md"
            variant="light"
            color="grape"
            mb="sm"
            className="home-feature-icon"
          >
            <IconBluetoothConnected size={32} stroke={1.5} />
          </ThemeIcon>
          <Text size="lg" fw={600} mb="xs" className="home-feature-card-title">
            {t("feature3Title")}
          </Text>
          <Text size="sm" className="home-feature-card-desc">
            {t("feature3Desc")}
          </Text>
        </Card>
      </SimpleGrid>
    </Stack>
  );
}

function HowItWorksSection() {
  const t = useTranslations("home");

  return (
    <Stack gap={32} py={40} className="home-how-section">
      <Title
        order={2}
        ta="center"
        className="home-how-title"
        style={{ fontWeight: 400, letterSpacing: "-0.03em" }}
      >
        {t("howItWorksTitle")}
      </Title>

      <SimpleGrid cols={{ base: 1, md: 3 }} spacing="xl">
        <Card withBorder shadow="sm" radius="md" padding="xl" className="home-how-card" ta="center">
          <ThemeIcon size={64} radius="xl" variant="light" color="silver" mb="md" className="home-how-icon">
            <IconSettingsAutomation size={32} />
          </ThemeIcon>
          <Title order={4} mb="xs" className="home-how-step-title">
            {t("step1Title")}
          </Title>
          <Text size="sm" maw={300} mx="auto" className="home-how-step-desc">
            {t("step1Desc")}
          </Text>
        </Card>

        <Card withBorder shadow="sm" radius="md" padding="xl" className="home-how-card" ta="center">
          <ThemeIcon size={64} radius="xl" variant="light" color="silver" mb="md" className="home-how-icon">
            <IconDeviceDesktopAnalytics size={32} />
          </ThemeIcon>
          <Title order={4} mb="xs" className="home-how-step-title">
            {t("step2Title")}
          </Title>
          <Text size="sm" maw={300} mx="auto" className="home-how-step-desc">
            {t("step2Desc")}
          </Text>
        </Card>

        <Card withBorder shadow="sm" radius="md" padding="xl" className="home-how-card" ta="center">
          <ThemeIcon size={64} radius="xl" variant="light" color="silver" mb="md" className="home-how-icon">
            <IconCheck size={32} />
          </ThemeIcon>
          <Title order={4} mb="xs" className="home-how-step-title">
            {t("step3Title")}
          </Title>
          <Text size="sm" maw={300} mx="auto" className="home-how-step-desc">
            {t("step3Desc")}
          </Text>
        </Card>
      </SimpleGrid>
    </Stack>
  );
}

function CtaSection({ authenticated }: { authenticated: boolean }) {
  const t = useTranslations("home");

  return (
    <Box
      className="home-cta-section home-cta-section--integrated"
      style={{
        position: "relative",
        borderRadius: 24,
        overflow: "hidden",
        marginTop: 20,
        marginBottom: 40,
        backgroundColor: "#070f1d",
        minHeight: "clamp(260px, 34vw, 360px)",
      }}
    >
      <Box className="home-cta-section__media">
        <Image
          src="/fary.png"
          alt=""
          fill
          className="home-cta-section__image"
          sizes="(max-width: 768px) 100vw, min(1180px, 100vw)"
          style={{ objectFit: "cover", objectPosition: "center 60%" }}
        />
      </Box>
      {/* Затемнение: центр слабее для текста, по краям чуть сильнее — фары остаются заметными */}
      <Box
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 72% 88% at 50% 42%, rgba(7,15,29,0.28) 0%, rgba(7,15,29,0.8) 62%, rgba(7,15,29,0.94) 100%)",
          pointerEvents: "none",
        }}
      />
      <Stack
        gap="md"
        align="center"
        justify="center"
        style={{
          position: "relative",
          zIndex: 1,
          padding: "clamp(40px, 5vw, 56px) 24px",
          minHeight: "clamp(260px, 34vw, 360px)",
          textAlign: "center",
          color: "white",
        }}
      >
        <Title order={2} c="white" mb="sm" style={{ fontWeight: 400, letterSpacing: "-0.03em" }}>
          {t("ctaTitle")}
        </Title>
        <Text size="lg" mb="xl" style={{ color: "#e2e8f0" }} maw={600} mx="auto">
          {t("ctaDesc")}
        </Text>

        {!authenticated ? (
          <Link href="/register" style={{ textDecoration: "none" }}>
            <Button className="btn-metallic" color="silver" radius="xl" size="lg" px={40}>
              {t("ctaButton")}
            </Button>
          </Link>
        ) : (
          <Link href="/cabinet/dashboard" style={{ textDecoration: "none" }}>
            <Button className="btn-metallic" color="silver" radius="xl" size="lg" px={40}>
              {t("heroStart")}
            </Button>
          </Link>
        )}
      </Stack>
    </Box>
  );
}

export default function HomePageClient() {
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    setAuthenticated(isAuthenticated());
  }, []);

  return (
    <Stack gap={0} className="home-page">
      <HeroSection authenticated={authenticated} />
      <FeaturesSection />
      <HowItWorksSection />
      <CtaSection authenticated={authenticated} />
    </Stack>
  );
}
