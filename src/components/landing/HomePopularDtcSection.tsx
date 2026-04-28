import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { localizedPath } from "@/lib/site-url";
import { POPULAR_DTC_CODES } from "@/data/popular-dtc-codes";

type Props = { locale: string };

/** Секция «популярные DTC» на главной — внутренняя перелинковка на хаб и карточки кодов. */
export default async function HomePopularDtcSection({ locale }: Props) {
  const t = await getTranslations({ locale, namespace: "landing" });

  return (
    <section
      className="landing-dtc-popular"
      style={{
        padding: "clamp(40px, 5vw, 72px) 0",
        display: "grid",
        gap: "1rem",
        borderTop: "1px solid color-mix(in srgb, var(--landing-text) 12%, transparent)",
      }}
    >
      <div>
        <h2 className="landing-section-title" style={{ marginBottom: "0.5rem" }}>
          {t("dtcPopular.title")}
        </h2>
        <p style={{ color: "var(--text-muted)", margin: 0, maxWidth: "52rem", lineHeight: 1.6 }}>
          {t("dtcPopular.subtitle")}
        </p>
      </div>
      <div>
        <Link
          href="/dtc"
          className="landing-learn-more"
          style={{ display: "inline-block", marginBottom: "1rem" }}
        >
          {t("dtcPopular.hubLink")}
        </Link>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(88px, 1fr))",
          gap: "0.5rem",
        }}
      >
        {POPULAR_DTC_CODES.map((code) => (
          <Link
            key={code}
            href={localizedPath(locale, `/dtc/${code}`)}
            className="landing-dtc-popular__pill"
            style={{
              display: "block",
              textAlign: "center",
              padding: "0.5rem 0.35rem",
              borderRadius: "8px",
              border: "1px solid color-mix(in srgb, var(--landing-text) 18%, transparent)",
              textDecoration: "none",
              color: "var(--landing-text)",
              fontWeight: 600,
              fontSize: "0.875rem",
            }}
          >
            {code}
          </Link>
        ))}
      </div>
    </section>
  );
}
