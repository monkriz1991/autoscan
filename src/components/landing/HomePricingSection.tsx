import { getTranslations } from "next-intl/server";
import { getPlansForLocale, type Plan, type PlanFeatures } from "@/lib/api";
import PlanCheckoutButton from "@/components/billing/PlanCheckoutButton";

type Props = { locale: string };

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

/** Скелетон блока тарифов — пока отдельный RSC-поток ждёт billing/plans. */
export function LandingPricingSkeleton() {
  return (
    <section className="landing-pricing" style={{ padding: "56px 0", display: "grid", gap: "1.5rem" }} aria-busy>
      <div>
        <div
          style={{
            height: 36,
            maxWidth: 280,
            borderRadius: 8,
            background: "linear-gradient(90deg, #1e293b 25%, #334155 50%, #1e293b 75%)",
            backgroundSize: "200% 100%",
            animation: "landing-skel-pulse 1.2s ease-in-out infinite",
          }}
        />
        <div
          style={{
            marginTop: 12,
            height: 20,
            maxWidth: 420,
            borderRadius: 6,
            background: "#334155",
            opacity: 0.7,
          }}
        />
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
          gap: "1rem",
        }}
      >
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              minHeight: 320,
              borderRadius: 16,
              background: "linear-gradient(180deg, #f1f5f9 0%, #e2e8f0 100%)",
              border: "1px solid #cbd5e1",
            }}
          />
        ))}
      </div>
      <style>{`
        @keyframes landing-skel-pulse {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </section>
  );
}

/**
 * Тарифы на главной: отдельный async RSC — первый paint hero/features без ожидания API тарифов.
 */
export default async function HomePricingSection({ locale }: Props) {
  const t = await getTranslations({ locale, namespace: "landing" });
  const tp = await getTranslations({ locale, namespace: "pricing" });
  const plans = await getPlansForLocale(locale).catch((err) => {
    console.error("[HomePricingSection] failed to load pricing plans", err);
    return [] as Plan[];
  });
  const sortedPlans = sortPlansForDisplay(plans);

  return (
    <section className="landing-pricing" style={{ padding: "56px 0", display: "grid", gap: "1.5rem" }}>
      <div>
        <h2 className="landing-section-title">{t("pricing.title")}</h2>
        <p className="landing-pricing__lead" style={{ lineHeight: 1.65 }}>
          {t("pricing.subtitle")}
        </p>
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
                    <p className="landing-pricing-card__price" style={{ margin: "8px 0 0", fontWeight: 800 }}>
                      {priceMain}
                    </p>
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
  );
}
