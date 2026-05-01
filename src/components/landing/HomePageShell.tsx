import Image from "next/image";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { localizedPath } from "@/lib/site-url";
import AuthDashboardLink from "./AuthDashboardLink";
import LandingHeroMedia from "./LandingHeroMedia";
import LandingVideo from "./LandingVideo";
import HomePricingSection, { LandingPricingSkeleton } from "./HomePricingSection";
import HomePopularDtcSection from "./HomePopularDtcSection";

type Props = { locale: string };

/** Ролики кладутся в `frontend/public/vidio/` (раздача как статика); без файлов сеть будет без шторма повторов за счёт LandingVideo. */
const HERO_PREVIEW_VIDEO_SRC = "/vidio/preview.mp4";
const HERO_PREVIEW_VIDEO_WEBM_SRC = "/vidio/preview.av1.webm";
const HERO_PREVIEW_POSTER_SRC = "/landing/hero-slide-diagnostics.png";
const FEATURES_HEADING_VIDEO_SRC = "/vidio/chatvideo.mp4";
const FEATURE_LIVE_VIDEO_SRC = "/vidio/realtime.mp4";
const FEATURE_LIVE_POSTER_SRC = "/landing/hero-slide-live.png";

const HERO_SCRIM_BG =
  "linear-gradient(105deg, rgba(14, 15, 17, 0.9) 0%, rgba(14, 15, 17, 0.78) 32%, rgba(14, 15, 17, 0.45) 68%, rgba(14, 15, 17, 0.55) 100%)";

const HERO_GRAIN_BG = [
  `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.15' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
  `url("data:image/svg+xml,%3Csvg viewBox='0 0 128 128' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='f'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23f)'/%3E%3C/svg%3E")`,
].join(", ");

/** Локальные PNG — стабильный рендер иконок ОС (без глифов шрифта в разных браузерах). */
const PLATFORM_ICON_WINDOWS = "/landing/platform-windows.png";
const PLATFORM_ICON_MACOS = "/landing/platform-macos.png";
const PLATFORM_ICON_LINUX = "/landing/platform-linux.png";

const BRAND_SLUGS = [
  "toyota",
  "bmw",
  "mercedes",
  "ford",
  "volkswagen",
  "honda",
  "audi",
  "hyundai",
  "kia",
  "nissan",
  "chevrolet",
  "subaru",
  "mazda",
  "volvo",
  "peugeot",
  "renault",
] as const;

/** SSR-контент главной: H1, тексты, CTA и основные секции видны в HTML без JS. Тарифы — отдельный RSC-поток (Suspense). */
export default async function HomePageShell({ locale }: Props) {
  const t = await getTranslations({ locale, namespace: "landing" });

  return (
    <div className="home-page">
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
        <div className="landing-hero__video-bg" style={{ position: "absolute", inset: 0, zIndex: 0, overflow: "hidden" }} aria-hidden>
          <LandingHeroMedia
            webmSrc={HERO_PREVIEW_VIDEO_WEBM_SRC}
            mp4Src={HERO_PREVIEW_VIDEO_SRC}
            poster={HERO_PREVIEW_POSTER_SRC}
            posterAlt={t("hero.backgroundPosterAlt")}
            className="landing-hero__video-bg-el"
          />
        </div>
        <div className="landing-hero__scrim" style={{ position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none", backgroundImage: HERO_SCRIM_BG }} aria-hidden />
        <div
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

        <div className="landing-hero__grid">
          <div className="landing-hero__copy" style={{ display: "grid", gap: "1.25rem", textAlign: "left" }}>
            <span
              className="landing-hero__badge"
              style={{
                justifySelf: "start",
                padding: "6px 12px",
                borderRadius: 999,
                background: "rgba(30, 37, 110, 0.34)",
                border: "1px solid rgba(191, 211, 255, 0.2)",
                boxShadow: "0 12px 30px rgba(30, 37, 110, 0.2)",
                color: "#dbe5ff",
                fontSize: "0.75rem",
                fontWeight: 600,
                letterSpacing: "0.02em",
              }}
            >
            {t("hero.badge")}
            </span>
            <h1
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
              {t("hero.headlineFree")} {t("hero.headlineAi")}
              <br />
              {t("hero.headlineSeconds")}
            </h1>
            <p className="landing-hero__sub" style={{ color: "#c2d1ff", textShadow: "0 1px 3px rgba(0, 0, 0, 0.5)" }}>
              {t("hero.subheadline")}
            </p>
            <p className="landing-hero__social" style={{ color: "#b8c9ff", margin: 0 }}>
              {t("hero.socialProofCta")}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              <a href={localizedPath(locale, "/download")} className="landing-store-btn landing-store-btn--primary" aria-label={t("hero.platformWindowsAria")}>
                <Image
                  src={PLATFORM_ICON_WINDOWS}
                  width={22}
                  height={22}
                  alt={t("hero.platformWindowsLabel")}
                  className="landing-store-btn__platform-icon"
                  priority
                />
                <span className="landing-store-btn__text">
                  <span className="landing-store-btn__kicker">{t("hero.platformKicker")}</span>
                  <span className="landing-store-btn__label">{t("hero.platformWindowsLabel")}</span>
                </span>
              </a>
              <a href={localizedPath(locale, "/download")} className="landing-store-btn landing-store-btn--secondary" aria-label={t("hero.platformMacAria")}>
                <Image
                  src={PLATFORM_ICON_MACOS}
                  width={22}
                  height={22}
                  alt={t("hero.platformMacLabel")}
                  className="landing-store-btn__platform-icon"
                  priority
                />
                <span className="landing-store-btn__text">
                  <span className="landing-store-btn__kicker">{t("hero.platformKicker")}</span>
                  <span className="landing-store-btn__label">{t("hero.platformMacLabel")}</span>
                </span>
              </a>
              <a href={localizedPath(locale, "/download")} className="landing-store-btn landing-store-btn--secondary" aria-label={t("hero.platformLinuxAria")}>
                <Image
                  src={PLATFORM_ICON_LINUX}
                  width={22}
                  height={22}
                  alt={t("hero.platformLinuxLabel")}
                  className="landing-store-btn__platform-icon"
                  priority
                />
                <span className="landing-store-btn__text">
                  <span className="landing-store-btn__kicker">{t("hero.platformKicker")}</span>
                  <span className="landing-store-btn__label">{t("hero.platformLinuxLabel")}</span>
                </span>
              </a>
            </div>
            <AuthDashboardLink />
          </div>
        </div>
      </section>

      {/* Видимая подпись к фону героя (видео/постер) — SEO и доступность вне aria-hidden контейнера */}
      <p
        className="landing-media-caption landing-media-caption--hero"
        style={{
          margin: 0,
          padding: "10px clamp(16px, 4vw, 32px) 0",
          fontSize: "0.8125rem",
          lineHeight: 1.55,
          color: "var(--text-muted)",
          textAlign: "center",
          maxWidth: 720,
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        {t("mediaCaptions.heroBackground")}
      </p>

      <section
        className="landing-seo-intro"
        style={{
          padding: "clamp(12px, 2vw, 20px) clamp(16px, 4vw, 32px)",
          background: "color-mix(in srgb, var(--landing-bg) 92%, transparent)",
        }}
      >
        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "0.875rem",
            lineHeight: 1.65,
            maxWidth: 720,
            margin: "0 auto",
            textAlign: "center",
          }}
        >
          {t("seoIntro")}
        </p>
      </section>

      <section
        className="landing-seo-details"
        aria-labelledby="landing-seo-details-title"
        style={{
          padding: "clamp(24px, 3vw, 40px) clamp(16px, 4vw, 32px)",
          background: "color-mix(in srgb, var(--landing-bg) 96%, transparent)",
        }}
      >
        <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gap: "1rem" }}>
          <h2 id="landing-seo-details-title" className="landing-section-title" style={{ margin: 0, textAlign: "center" }}>
            {t("seoDetails.title")}
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", lineHeight: 1.65, margin: 0 }}>
            {t("seoDetails.p1")}
          </p>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", lineHeight: 1.65, margin: 0 }}>
            {t("seoDetails.p2")}
          </p>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", lineHeight: 1.65, margin: 0 }}>
            {t("seoDetails.p3")}
          </p>
        </div>
      </section>

      <section className="landing-features" style={{ padding: "48px 0" }}>
        <div className="landing-features__heading-split">
          <div className="landing-features__heading-copy" style={{ display: "grid", gap: "1rem" }}>
            <h2 className="landing-section-title landing-features__split-section-title">
              {t("features.sectionTitle")}
            </h2>
            <h3 className="landing-features__chat-lead-title">{t("features.chatLeadTitle")}</h3>
            <p className="landing-features__chat-lead-body" style={{ color: "var(--text-muted)", lineHeight: 1.65, margin: 0 }}>
              {t("features.chatLeadBody")}
            </p>
          </div>
          <div className="landing-features__heading-video-col">
            <figure className="landing-features__heading-video-figure">
              <div className="landing-features__heading-video-stage" role="img" aria-label={t("features.chatVideoAria")}>
                <div className="landing-features__heading-video-wrap" aria-hidden>
                  <LandingVideo
                    mp4Src={FEATURES_HEADING_VIDEO_SRC}
                    poster={HERO_PREVIEW_POSTER_SRC}
                    posterAlt={t("features.chatVideoPosterAlt")}
                    priority="feature"
                    className="landing-features__heading-video"
                    preload="metadata"
                  />
                </div>
              </div>
              <figcaption
                style={{
                  fontSize: "0.8125rem",
                  lineHeight: 1.55,
                  color: "var(--text-muted)",
                  margin: 0,
                }}
              >
                {t("mediaCaptions.chatVideo")}
              </figcaption>
            </figure>
          </div>
        </div>

        <div className="landing-feature landing-feature--visible landing-feature--image-right">
          <div className="landing-feature__media">
            <figure style={{ margin: 0, display: "grid", gap: "0.5rem" }}>
              <div className="landing-feature__video-shell" role="img" aria-label={t("features.liveDataVideoAria")}>
                <div className="landing-feature__video-stage">
                  <div className="landing-feature__video-wrap" aria-hidden>
                    <LandingVideo
                      mp4Src={FEATURE_LIVE_VIDEO_SRC}
                      poster={FEATURE_LIVE_POSTER_SRC}
                      posterAlt={t("features.liveDataPosterAlt")}
                      priority="feature"
                      className="landing-feature__video"
                      preload="metadata"
                    />
                  </div>
                </div>
              </div>
              <figcaption
                style={{
                  fontSize: "0.8125rem",
                  lineHeight: 1.55,
                  color: "var(--text-muted)",
                  margin: 0,
                }}
              >
                {t("mediaCaptions.liveData")}
              </figcaption>
            </figure>
          </div>
          <div className="landing-feature__stack" style={{ display: "grid", gap: "1rem", textAlign: "left" }}>
            <span className="landing-feature__tag landing-feature__tag--pro">{t("features.f4.tag")}</span>
            <h2 className="landing-feature__title">{t("features.f4.title")}</h2>
            <p className="landing-feature__body" style={{ color: "var(--text-muted)", lineHeight: 1.65, margin: 0 }}>
              {t("features.f4.body")}
            </p>
            <a href={localizedPath(locale, "/pricing")} className="landing-learn-more">
              {t("features.f4.learnMore")}
            </a>
          </div>
        </div>
      </section>

      <section className="landing-cars" style={{ padding: "48px 0", display: "grid", gap: "1rem" }}>
        <h2 className="landing-section-title">
          {t("cars.title")}
        </h2>
        <p className="landing-cars__subtitle">{t("cars.subtitle")}</p>
        <div className="landing-ticker" role="presentation">
          <div className="landing-ticker__track">
            {[0, 1].map((dup) =>
              BRAND_SLUGS.map((slug) => (
                <img
                  key={`${dup}-${slug}`}
                  src={`/landing/brands/${slug}.svg`}
                  width={40}
                  height={40}
                  alt={t(`cars.brands.${slug}` as `cars.brands.${(typeof BRAND_SLUGS)[number]}`)}
                  loading="lazy"
                  decoding="async"
                  className="landing-ticker__logo"
                />
              )),
            )}
          </div>
        </div>
        <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", margin: 0 }}>{t("cars.footnote")}</p>
      </section>

      <HomePopularDtcSection locale={locale} />

      <Suspense fallback={<LandingPricingSkeleton />}>
        <HomePricingSection locale={locale} />
      </Suspense>
    </div>
  );
}
