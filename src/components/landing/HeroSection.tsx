"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Box, Stack, Text, Title } from "@mantine/core";
import Image from "next/image";
import { Link } from "@/i18n/navigation";

/** Локальные PNG — стабильный рендер иконок ОС (без внешних CDN и глифов шрифта). */
const PLATFORM_ICON_WINDOWS = "/landing/platform-windows.png";
const PLATFORM_ICON_MACOS = "/landing/platform-macos.png";
const PLATFORM_ICON_LINUX = "/landing/platform-linux.png";

/** Видео-превью на главной (файл из `public/vidio/`). */
const HERO_PREVIEW_VIDEO_SRC = "/vidio/preview.mp4";
/** Постер для загрузки и для prefers-reduced-motion (без автовоспроизведения). */
const HERO_PREVIEW_POSTER_SRC = "/landing/hero-slide-diagnostics.png";

/** Инлайн дублируем SCSS: глобальные классы героя не всегда побеждают Mantine CSS layers. */
const HERO_SCRIM_BG =
  "linear-gradient(105deg, rgba(14, 15, 17, 0.9) 0%, rgba(14, 15, 17, 0.78) 32%, rgba(14, 15, 17, 0.45) 68%, rgba(14, 15, 17, 0.55) 100%)";

const HERO_GRAIN_BG = [
  `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.15' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
  `url("data:image/svg+xml,%3Csvg viewBox='0 0 128 128' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='f'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23f)'/%3E%3C/svg%3E")`,
].join(", ");

type Props = {
  authenticated: boolean;
};

export default function HeroSection({ authenticated }: Props) {
  const t = useTranslations("landing.hero");
  const heroVideoRef = useRef<HTMLVideoElement>(null);
  const [reduceMotion, setReduceMotion] = useState(false);

  // Blur на видео + play/pause: один matchMedia (без дублирования слушателей)
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      const rm = mq.matches;
      setReduceMotion(rm);
      const video = heroVideoRef.current;
      if (!video) return;
      if (rm) video.pause();
      else video.play().catch(() => {});
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return (
    <section
      className="landing-hero landing-hero--bleed"
      style={{
        position: "relative",
        padding: "clamp(48px, 6vw, 88px) clamp(16px, 4vw, 32px) clamp(56px, 7vw, 96px)",
        overflow: "hidden",
        backgroundColor: "var(--landing-bg)",
        color: "var(--landing-text)",
      }}
    >
      {/* Видео на весь hero (фон); текст и кнопки — выше по z-index */}
      {/* Инлайн position/inset/z-index дублируют SCSS — фон на весь герой стабильнее при порядке стилей Mantine/CSS layers. */}
      <div
        className="landing-hero__video-bg"
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          overflow: "hidden",
          width: "100%",
          height: "100%",
        }}
        aria-hidden
      >
        <video
          ref={heroVideoRef}
          className="landing-hero__video-bg-el"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            minWidth: "100%",
            minHeight: "100%",
            objectFit: "cover",
            objectPosition: "center",
            pointerEvents: "none",
            display: "block",
            transform: reduceMotion ? undefined : "scale(1.08)",
            transformOrigin: "center center",
            filter: reduceMotion ? undefined : "blur(6px)",
          }}
          muted
          loop
          playsInline
          preload="auto"
          poster={HERO_PREVIEW_POSTER_SRC}
          aria-hidden
        >
          <source src={HERO_PREVIEW_VIDEO_SRC} type="video/mp4" />
        </video>
      </div>
      <div
        className="landing-hero__scrim"
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          pointerEvents: "none",
          backgroundImage: HERO_SCRIM_BG,
        }}
        aria-hidden
      />
      <Box
        className="landing-hero__grain"
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 2,
          pointerEvents: "none",
          opacity: 0.2,
          mixBlendMode: "overlay",
          backgroundImage: HERO_GRAIN_BG,
          backgroundSize: "180px 180px, 96px 96px",
          backgroundRepeat: "repeat",
        }}
        aria-hidden
      />
      <Box className="landing-hero__grid">
        <Stack gap="lg" className="landing-hero__copy" style={{ textAlign: "left" }}>
          <Text
            component="span"
            className="landing-hero__badge"
            size="xs"
            fw={600}
            style={{
              alignSelf: "flex-start",
              padding: "6px 12px",
              borderRadius: 999,
              background: "rgba(30, 37, 110, 0.34)",
              border: "1px solid rgba(191, 211, 255, 0.2)",
              boxShadow: "0 12px 30px rgba(30, 37, 110, 0.2)",
              color: "#dbe5ff",
              letterSpacing: "0.02em",
            }}
          >
            {t("badge")}
          </Text>

          {/* Переливающийся градиент — только в SCSS (clip на h1), без filter у предков — иначе артефакты в Chrome/YaBrowser */}
          <Title
            order={1}
            component="h1"
            className="landing-hero__title"
            style={{
              fontFamily: "var(--landing-font-display)",
              fontWeight: 800,
              fontSize: "clamp(2.25rem, 5vw, 3.5rem)",
              lineHeight: 1.08,
              letterSpacing: "-0.03em",
              margin: 0,
            }}
          >
            {t("headlineFree")} {t("headlineAi")}
            <br />
            {t("headlineSeconds")}
          </Title>

          <p
            className="landing-hero__sub"
            style={{
              color: "#c2d1ff",
              textShadow:
                "0 1px 3px rgba(0, 0, 0, 0.5), 0 0 24px rgba(79, 102, 239, 0.16)",
            }}
          >
            {t("subheadline")}
          </p>

          <Text
            size="sm"
            className="landing-hero__social"
            style={{ color: "#b8c9ff", textShadow: "0 1px 2px rgba(0, 0, 0, 0.45)" }}
          >
            {t("socialProofCta")}
          </Text>

          <Box
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <Link
              href="/download"
              className="landing-store-btn landing-store-btn--primary"
              aria-label={t("platformWindowsAria")}
            >
              <Image
                src={PLATFORM_ICON_WINDOWS}
                width={22}
                height={22}
                alt={t("platformWindowsLabel")}
                className="landing-store-btn__platform-icon"
                priority
              />
              <span className="landing-store-btn__text">
                <span className="landing-store-btn__kicker">{t("platformKicker")}</span>
                <span className="landing-store-btn__label">{t("platformWindowsLabel")}</span>
              </span>
            </Link>
            <Link
              href="/download"
              className="landing-store-btn landing-store-btn--secondary"
              aria-label={t("platformMacAria")}
            >
              <Image
                src={PLATFORM_ICON_MACOS}
                width={22}
                height={22}
                alt={t("platformMacLabel")}
                className="landing-store-btn__platform-icon"
                priority
              />
              <span className="landing-store-btn__text">
                <span className="landing-store-btn__kicker">{t("platformKicker")}</span>
                <span className="landing-store-btn__label">{t("platformMacLabel")}</span>
              </span>
            </Link>
            <Link
              href="/download"
              className="landing-store-btn landing-store-btn--secondary"
              aria-label={t("platformLinuxAria")}
            >
              <Image
                src={PLATFORM_ICON_LINUX}
                width={22}
                height={22}
                alt={t("platformLinuxLabel")}
                className="landing-store-btn__platform-icon"
                priority
              />
              <span className="landing-store-btn__text">
                <span className="landing-store-btn__kicker">{t("platformKicker")}</span>
                <span className="landing-store-btn__label">{t("platformLinuxLabel")}</span>
              </span>
            </Link>
          </Box>

          {authenticated ? (
            <Text size="sm">
              <Link href="/cabinet/dashboard" style={{ color: "#dbe5ff" }}>
                {t("dashboardLink")}
              </Link>
            </Text>
          ) : null}
        </Stack>
      </Box>
    </section>
  );
}
