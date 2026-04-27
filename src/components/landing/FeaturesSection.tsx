"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Box, Stack, Text, Title } from "@mantine/core";
import PredictProblemsFeature from "./PredictProblemsFeature";
import RepairCostEstimateFeature from "./RepairCostEstimateFeature";
import { useRevealOnScroll } from "./useRevealOnScroll";

/** Видео чата в левой колонке split-блока */
const FEATURES_HEADING_VIDEO_SRC = "/vidio/chatvideo.mp4";
/** Видео блока «Live engine data»: MP4 для Chrome/Firefox; MOV — запас для Safari */
const FEATURE_F4_LIVE_VIDEO_MP4 = "/vidio/realtime.mp4";
const FEATURE_F4_LIVE_VIDEO_MOV = "/vidio/realtime.mov";
/** Постер и запас, если декодер не подхватил ролик */
const FEATURE_F4_VIDEO_POSTER = "/landing/hero-slide-live.png";
const FEATURE_F4_FALLBACK_IMAGE = "/landing/feature-live.svg";

const FEATURE_F4_SOURCES = [FEATURE_F4_LIVE_VIDEO_MP4, FEATURE_F4_LIVE_VIDEO_MOV] as const;

function FeatureBlock({
  featureKey,
  image,
  videoSources,
  videoAriaLabel,
  imageLeft,
  mountVideo,
}: {
  featureKey: "f4";
  image?: string;
  videoSources?: readonly string[];
  videoAriaLabel?: string;
  imageLeft: boolean;
  mountVideo: boolean;
}) {
  const t = useTranslations(`landing.features.${featureKey}`);
  const { ref, visible } = useRevealOnScroll<HTMLDivElement>();
  const [videoFailed, setVideoFailed] = useState(false);
  const onVideoError = useCallback(() => {
    setVideoFailed(true);
  }, []);

  const tag = t("tag");

  return (
    <Box
      ref={ref}
      className={`landing-feature ${visible ? "landing-feature--visible" : ""} ${imageLeft ? "" : "landing-feature--image-right"}`}
    >
      <Box className="landing-feature__media">
        {videoSources ? (
          <Box
            className="landing-feature__video-shell"
            role="img"
            aria-label={videoAriaLabel}
          >
            <div className="landing-feature__video-stage">
              <div className="landing-feature__video-wrap" aria-hidden>
                {videoFailed ? (
                  <img
                    src={FEATURE_F4_FALLBACK_IMAGE}
                    width={560}
                    height={360}
                    alt=""
                    className="landing-feature__video-fallback"
                  />
                ) : mountVideo ? (
                  <video
                    className="landing-feature__video"
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="auto"
                    poster={FEATURE_F4_VIDEO_POSTER}
                    onError={onVideoError}
                    aria-hidden
                  >
                    <source src={videoSources[0]} type="video/mp4" />
                    {videoSources[1] ? <source src={videoSources[1]} type="video/quicktime" /> : null}
                  </video>
                ) : (
                  <img
                    src={FEATURE_F4_VIDEO_POSTER}
                    width={560}
                    height={360}
                    alt=""
                    className="landing-feature__video-poster-hold"
                  />
                )}
              </div>
            </div>
          </Box>
        ) : image ? (
          <img src={image} width={560} height={360} loading="lazy" alt="" className="landing-feature__img" />
        ) : null}
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
        <Link href="/pricing" className="landing-learn-more">
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

      <PredictProblemsFeature />

      <RepairCostEstimateFeature />

      <FeatureBlock
        featureKey="f4"
        videoSources={FEATURE_F4_SOURCES}
        videoAriaLabel={t("liveDataVideoAria")}
        imageLeft={false}
        mountVideo={mountVideo}
      />
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
