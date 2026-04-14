"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Box, Stack, Text, Title } from "@mantine/core";
import { useRevealOnScroll } from "./useRevealOnScroll";

/** Видео чата в левой колонке split-блока */
const FEATURES_HEADING_VIDEO_SRC = "/vidio/chatvideo.mp4";

const FEATURES = [
  { key: "f2" as const, image: "/landing/feature-predict.svg", imageLeft: false },
  { key: "f3" as const, image: "/landing/feature-cost.svg", imageLeft: true },
  { key: "f4" as const, image: "/landing/feature-live.svg", imageLeft: false },
] as const;

function FeatureBlock({
  featureKey,
  image,
  imageLeft,
}: {
  featureKey: (typeof FEATURES)[number]["key"];
  image: string;
  imageLeft: boolean;
}) {
  const t = useTranslations(`landing.features.${featureKey}`);
  const { ref, visible } = useRevealOnScroll<HTMLDivElement>();

  const tag = t("tag");

  return (
    <Box
      ref={ref}
      className={`landing-feature ${visible ? "landing-feature--visible" : ""} ${imageLeft ? "" : "landing-feature--image-right"}`}
    >
      <Box className="landing-feature__media">
        <img src={image} width={560} height={360} loading="lazy" alt="" className="landing-feature__img" />
      </Box>
      <Stack gap="md" className="landing-feature__stack" style={{ textAlign: "left" }}>
        <Box style={{ position: "relative" }}>
          <Text
            component="span"
            size="xs"
            fw={700}
            className={`landing-feature__tag landing-feature__tag--${tag === "NEW" ? "new" : "pro"}`}
            style={{
              display: "inline-block",
              marginBottom: 8,
              padding: "4px 10px",
              borderRadius: 6,
              letterSpacing: "0.06em",
            }}
          >
            {tag}
          </Text>
          <Title order={2} className="landing-feature__title" style={{ fontWeight: 700, letterSpacing: "-0.02em" }}>
            {t("title")}
          </Title>
        </Box>
        <Text className="landing-feature__body" size="md" style={{ lineHeight: 1.65, color: "var(--text-muted)" }}>
          {t("body")}
        </Text>
        <Link href="/marketing/pricing" className="landing-learn-more">
          {t("learnMore")}
        </Link>
      </Stack>
    </Box>
  );
}

export default function FeaturesSection() {
  const t = useTranslations("landing.features");
  const tLinks = useTranslations("landing.contentLinks");
  // Видео только после гидратации: SSR и первый клиентский проход совпадают (пустой wrap), без расхождений из-за <video>/<source>.
  const [mountVideo, setMountVideo] = useState(false);
  useEffect(() => {
    setMountVideo(true);
  }, []);

  return (
    <Stack component="section" gap={0} py={48} id="features" className="landing-features">
      <Box component="div" mb={40} className="landing-features__heading-split">
        {/* Слева: заголовок секции + продающий текст; справа: видео */}
        <Stack gap="md" className="landing-features__heading-copy">
          <Title order={2} className="landing-section-title landing-features__split-section-title">
            {t("sectionTitle")}
          </Title>
          <Title order={3} className="landing-features__chat-lead-title">
            {t("chatLeadTitle")}
          </Title>
          <Text
            className="landing-features__chat-lead-body"
            size="md"
            style={{ lineHeight: 1.65, color: "var(--text-muted)" }}
          >
            {t("chatLeadBody")}
          </Text>
        </Stack>

        <Box className="landing-features__heading-video-col">
          <div
            className="landing-features__heading-video-stage"
            role="img"
            aria-label={t("chatVideoAria")}
          >
            <div className="landing-features__heading-video-wrap" aria-hidden>
              {mountVideo ? (
                <video
                  className="landing-features__heading-video"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  aria-hidden
                >
                  <source src={FEATURES_HEADING_VIDEO_SRC} type="video/mp4" />
                </video>
              ) : null}
            </div>
          </div>
        </Box>
      </Box>

      {FEATURES.map((f) => (
        <FeatureBlock key={f.key} featureKey={f.key} image={f.image} imageLeft={f.imageLeft} />
      ))}
      <Text size="sm" mt="md" style={{ color: "var(--text-muted)", lineHeight: 1.65 }}>
        <span style={{ fontWeight: 600, color: "var(--text-color)" }}>{tLinks("title")}</span>{" "}
        <Link href="/blog/obd2-check-engine-light-codes-guide" className="landing-learn-more" style={{ marginRight: 8 }}>
          {tLinks("obd2Codes")}
        </Link>
        <span aria-hidden>·</span>{" "}
        <Link href="/marketing/compare-obd2-apps" className="landing-learn-more">
          {tLinks("compareApps")}
        </Link>
      </Text>
    </Stack>
  );
}
