import { getTranslations } from "next-intl/server";
import { localizedPath } from "@/lib/site-url";
import { getPlansForLocale, type Plan, type PlanFeatures } from "@/lib/api";
import PlanCheckoutButton from "@/components/billing/PlanCheckoutButton";
import AuthDashboardLink from "./AuthDashboardLink";

type Props = { locale: string };

const HERO_PREVIEW_VIDEO_SRC = "/vidio/preview.mp4";
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

const TIER_ORDER: Record<string, number> = {
  free: 0,
  lite: 1,
  basic: 2,
  pro: 3,
  premium: 4,
};

const defaultFeatures: PlanFeatures = {
  unlimited_devices: false,
  scan_errors: false,
  view_params: false,
  vehicle_config: false,
  ai_chat_history: false,
  record_params: false,
  metrics_history: false,
  realtime_analysis: false,
};

function durationSortKey(durationDays: number | null): number {
  if (durationDays === null) return 0;
  if (durationDays === 30) return 1;
  if (durationDays === 365) return 2;
  return 3;
}

function sortPlansForDisplay(plans: Plan[]): Plan[] {
  return [...plans].sort((a, b) => {
    const ta = TIER_ORDER[a.tier.toLowerCase()] ?? 99;
    const tb = TIER_ORDER[b.tier.toLowerCase()] ?? 99;
    if (ta !== tb) return ta - tb;
    const da = durationSortKey(a.duration_days);
    const db = durationSortKey(b.duration_days);
    if (da !== db) return da - db;
    return a.id - b.id;
  });
}

function isFreeTier(plan: Plan): boolean {
  const tier = plan.tier.toLowerCase();
  if (tier === "free") return true;
  const n = parseFloat(plan.price);
  return Number.isFinite(n) && n <= 0;
}

function isFeaturedPlan(plan: Plan): boolean {
  return plan.tier.toLowerCase() === "pro" && plan.duration_days !== 365;
}

function tierRank(plan: Plan): number {
  return TIER_ORDER[plan.tier.toLowerCase()] ?? 99;
}

function planFeatures(plan: Plan): PlanFeatures {
  return plan.features ?? defaultFeatures;
}

/** SSR-контент главной: H1, тексты, CTA и основные секции видны в HTML без JS. */
export default async function HomePageShell({ locale }: Props) {
  const t = await getTranslations({ locale, namespace: "landing" });
  const tNav = await getTranslations({ locale, namespace: "nav" });
  const tp = await getTranslations({ locale, namespace: "pricing" });
  const plans = await getPlansForLocale(locale).catch((err) => {
    console.error("[HomePageShell] failed to load pricing plans", err);
    return [] as Plan[];
  });
  const sortedPlans = sortPlansForDisplay(plans);

  return (
    <div className="home-page">
      <section
        className="landing-hero"
        style={{
          width: "100vw",
          position: "relative",
          left: "50%",
          right: "50%",
          marginLeft: "-50vw",
          marginRight: "-50vw",
          padding: "clamp(48px, 6vw, 88px) clamp(16px, 4vw, 32px) clamp(56px, 7vw, 96px)",
          overflow: "hidden",
          backgroundColor: "var(--landing-bg)",
          color: "var(--landing-text)",
        }}
      >
        <div className="landing-hero__video-bg" style={{ position: "absolute", inset: 0, zIndex: 0, overflow: "hidden" }} aria-hidden>
          <video
            className="landing-hero__video-bg-el"
            muted
            loop
            playsInline
            autoPlay
            preload="metadata"
            poster={HERO_PREVIEW_POSTER_SRC}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center",
              pointerEvents: "none",
              display: "block",
              transform: "scale(1.08)",
              filter: "blur(6px)",
            }}
          >
            <source src={HERO_PREVIEW_VIDEO_SRC} type="video/mp4" />
          </video>
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
                <span aria-hidden>⊞</span>
                <span className="landing-store-btn__text">
                  <span className="landing-store-btn__kicker">{t("hero.platformKicker")}</span>
                  <span className="landing-store-btn__label">{t("hero.platformWindowsLabel")}</span>
                </span>
              </a>
              <a href={localizedPath(locale, "/download")} className="landing-store-btn landing-store-btn--secondary" aria-label={t("hero.platformMacAria")}>
                <span aria-hidden></span>
                <span className="landing-store-btn__text">
                  <span className="landing-store-btn__kicker">{t("hero.platformKicker")}</span>
                  <span className="landing-store-btn__label">{t("hero.platformMacLabel")}</span>
                </span>
              </a>
              <a href={localizedPath(locale, "/download")} className="landing-store-btn landing-store-btn--secondary" aria-label={t("hero.platformLinuxAria")}>
                <span aria-hidden>◆</span>
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
            <div className="landing-features__heading-video-stage" role="img" aria-label={t("features.chatVideoAria")}>
              <div className="landing-features__heading-video-wrap" aria-hidden>
                <video className="landing-features__heading-video" autoPlay muted loop playsInline preload="metadata">
                  <source src={FEATURES_HEADING_VIDEO_SRC} type="video/mp4" />
                </video>
              </div>
            </div>
          </div>
        </div>

        <div className="landing-feature landing-feature--visible landing-feature--image-right">
          <div className="landing-feature__media">
            <div className="landing-feature__video-shell" role="img" aria-label={t("features.liveDataVideoAria")}>
              <div className="landing-feature__video-stage">
                <div className="landing-feature__video-wrap" aria-hidden>
                  <video className="landing-feature__video" autoPlay muted loop playsInline preload="metadata" poster={FEATURE_LIVE_POSTER_SRC}>
                    <source src={FEATURE_LIVE_VIDEO_SRC} type="video/mp4" />
                  </video>
                </div>
              </div>
            </div>
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
                  alt=""
                  loading="lazy"
                  className="landing-ticker__logo"
                />
              )),
            )}
          </div>
        </div>
        <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", margin: 0 }}>{t("cars.footnote")}</p>
      </section>

      <section className="landing-pricing" style={{ padding: "56px 0", display: "grid", gap: "1.5rem" }}>
        <div>
          <h2 className="landing-section-title">
            {t("pricing.title")}
          </h2>
          <p className="landing-pricing__lead" style={{ lineHeight: 1.65 }}>{t("pricing.subtitle")}</p>
        </div>
        <div className="landing-pricing__grid">
          {sortedPlans.length === 0 ? (
            <p style={{ color: "#d1dae6", margin: 0 }}>{tp("noPlans")}</p>
          ) : (
            sortedPlans.map((plan) => {
              const f = planFeatures(plan);
              const free = isFreeTier(plan);
              const featured = isFeaturedPlan(plan);
              const aiCount = plan.max_requests ?? 0;
              const proOrHigher = tierRank(plan) >= TIER_ORDER.pro;
              const predictiveMaintenance = f.predictive_maintenance_alerts ?? proOrHigher;
              const aiBlogSearch = f.ai_blog_search ?? proOrHigher;
              const aiChatAssistant = f.ai_chat_assistant ?? proOrHigher;
              const priceMain = free ? tp("freePriceDisplay") : `${plan.price} ${plan.currency}`;
              const period =
                plan.duration_days === null
                  ? tp("unlimited")
                  : plan.duration_days === 30
                    ? tp("periodBilledMonthly")
                    : plan.duration_days === 365
                      ? tp("periodBilledYearly")
                      : tp("days", { count: plan.duration_days });
              const devicesNote = f.unlimited_devices
                ? tp("devicesUnlimited_explained")
                : tp("devicesLimited_explained", { count: plan.max_devices });
              const rows = [
                [f.scan_errors, tp("feature_scan_errors")],
                [aiCount > 0, tp("cardLine_ai", { count: aiCount })],
                [f.view_params, tp("compare_live")],
                [f.record_params, tp("compare_export")],
                [f.metrics_history, tp("compare_history")],
                [predictiveMaintenance, tp("feature_predictive_maintenance")],
                [aiBlogSearch, tp("feature_ai_blog_search")],
                [aiChatAssistant, tp("feature_ai_chat_assistant")],
                [!free, free ? tp("supportCommunity") : tp("supportStandard")],
              ] as const;

              return (
                <article
                  key={plan.id}
                  className={`landing-pricing-card${featured ? " landing-pricing-card--pro" : ""}`}
                  style={{ display: "flex", flexDirection: "column", gap: 16 }}
                >
                  {featured ? (
                    <span className="landing-pricing-card__ribbon" style={{ fontWeight: 800 }}>
                      {tp("badgeMostPopular")}
                    </span>
                  ) : null}
                  <div>
                    <h3 style={{ margin: 0, color: "#0f172a", fontSize: "1.25rem", fontWeight: 800 }}>{plan.name}</h3>
                    <div className="landing-pricing-card__price-wrap">
                      <p className="landing-pricing-card__price" style={{ margin: "8px 0 0", fontWeight: 800 }}>{priceMain}</p>
                    </div>
                    <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: "0.875rem" }}>
                      {free ? tp("freeForever") : period}
                    </p>
                    <p style={{ margin: "10px 0 0", color: "#475569", fontSize: "0.875rem", lineHeight: 1.5 }}>
                      {devicesNote}
                    </p>
                  </div>
                  <ul style={{ display: "grid", gap: 10, margin: 0, padding: 0, listStyle: "none", color: "#334155" }}>
                    {rows.map(([enabled, label]) => (
                      <li key={label} style={{ display: "grid", gridTemplateColumns: "22px 1fr", gap: 10, alignItems: "start" }}>
                        <span className={enabled ? "landing-pricing-icon-yes" : "landing-pricing-icon-no"} aria-hidden>
                          {enabled ? "✓" : "×"}
                        </span>
                        <span style={!enabled ? { textDecoration: "line-through", opacity: 0.72 } : undefined}>{label}</span>
                      </li>
                    ))}
                  </ul>
                  <div style={{ marginTop: "auto" }}>
                    <PlanCheckoutButton plan={plan} />
                    {free ? (
                      <p style={{ margin: "0.75rem 0 0", textAlign: "center", color: "#64748b", fontSize: "0.875rem" }}>
                        {tp("freeNoCreditCard")}
                      </p>
                    ) : null}
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
