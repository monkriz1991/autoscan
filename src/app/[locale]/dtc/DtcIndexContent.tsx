import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getDtcListForLocale } from "@/lib/api";
import { localizedPath } from "@/lib/site-url";

type SP = {
  q?: string | string[];
  family?: string | string[];
  has_articles?: string | string[];
  page?: string | string[];
};

function firstString(v: string | string[] | undefined): string {
  if (typeof v === "string") return v;
  if (Array.isArray(v) && v[0]) return v[0];
  return "";
}

function buildQuery(
  base: Record<string, string>,
  overrides: Record<string, string | undefined>,
): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...base, ...overrides })) {
    if (!v) continue;
    if (k === "page" && v === "1") continue;
    sp.set(k, v);
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

/** Номера страниц и «…» при длинной пагинации */
function paginationItems(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 1) return [];
  const delta = 2;
  const set = new Set<number>();
  set.add(1);
  set.add(total);
  for (let p = current - delta; p <= current + delta; p++) {
    if (p >= 1 && p <= total) set.add(p);
  }
  const sorted = [...set].sort((a, b) => a - b);
  const out: (number | "ellipsis")[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) out.push("ellipsis");
    out.push(sorted[i]);
  }
  return out;
}

type Props = { locale: string; searchParams: SP };

/** Список DTC, фильтры и пагинация (GET-параметры). */
export default async function DtcIndexContent({ locale, searchParams }: Props) {
  const t = await getTranslations({ locale, namespace: "dtcPage" });
  const q = firstString(searchParams.q).trim();
  const family = firstString(searchParams.family).trim().toUpperCase().slice(0, 1);
  const hasA = firstString(searchParams.has_articles).trim().toLowerCase();
  let page = Number.parseInt(firstString(searchParams.page) || "1", 10);
  if (!Number.isFinite(page) || page < 1) page = 1;

  const baseQs = { q, family: family && "PBCU".includes(family) ? family : "", has_articles: hasA };

  let data;
  try {
    data = await getDtcListForLocale(locale, {
      q: q || undefined,
      family: baseQs.family || undefined,
      has_articles: hasA === "true" || hasA === "false" ? hasA : undefined,
      page,
      page_size: 24,
    });
  } catch {
    return <p style={{ color: "#b91c1c" }}>{t("error")}</p>;
  }

  // pathBase — для plain HTML (<form action>): тут нужен явный префикс локали.
  // linkBase — для <Link> next-intl: тот сам приклеит префикс, иначе локаль задвоится.
  const pathBase = localizedPath(locale, "/dtc");
  const linkBase = "/dtc";

  return (
    <div style={{ maxWidth: "72rem", margin: "0 auto", padding: "0 1rem 3rem" }}>
      <form
        method="get"
        action={pathBase}
        style={{
          display: "grid",
          gap: "1rem",
          marginBottom: "1.5rem",
          padding: "1rem",
          borderRadius: "1rem",
          background: "rgba(15, 23, 42, 0.04)",
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "flex-end" }}>
          <label style={{ flex: "2 1 200px", display: "grid", gap: "0.35rem" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 600 }}>{t("searchPlaceholder")}</span>
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder={t("searchPlaceholder")}
              style={{ padding: "0.5rem 0.75rem", borderRadius: "0.5rem", border: "1px solid #cbd5e1" }}
            />
          </label>
          <label style={{ display: "grid", gap: "0.35rem" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 600 }}>{t("familyLabel")}</span>
            <select
              name="family"
              defaultValue={family && "PBCU".includes(family) ? family : ""}
              style={{ padding: "0.5rem 0.75rem", borderRadius: "0.5rem", border: "1px solid #cbd5e1" }}
            >
              <option value="">{t("familyAll")}</option>
              <option value="P">{t("familyP")}</option>
              <option value="B">{t("familyB")}</option>
              <option value="C">{t("familyC")}</option>
              <option value="U">{t("familyU")}</option>
            </select>
          </label>
          <label style={{ display: "grid", gap: "0.35rem" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 600 }}>{t("hasArticlesLabel")}</span>
            <select
              name="has_articles"
              defaultValue={hasA === "true" || hasA === "false" ? hasA : ""}
              style={{ padding: "0.5rem 0.75rem", borderRadius: "0.5rem", border: "1px solid #cbd5e1" }}
            >
              <option value="">{t("hasArticlesAll")}</option>
              <option value="true">{t("hasArticlesYes")}</option>
              <option value="false">{t("hasArticlesNo")}</option>
            </select>
          </label>
          <button type="submit" className="btn-cta-primary" style={{ padding: "0.55rem 1rem" }}>
            {t("submitSearch")}
          </button>
          <Link href={linkBase} style={{ padding: "0.55rem 0.75rem", color: "#64748b" }}>
            {t("reset")}
          </Link>
        </div>
      </form>

      {data.results.length === 0 ? (
        <p style={{ color: "#64748b" }}>{t("empty")}</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 280px), 1fr))",
            gap: "1rem",
          }}
        >
          {data.results.map((row) => (
            <Link
              key={row.code}
              href={`/dtc/${row.code}`}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <article
                className="download-option-card"
                style={{
                  padding: "1.1rem",
                  borderRadius: "1rem",
                  minHeight: "100%",
                  display: "grid",
                  gap: "0.5rem",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem" }}>
                  <span style={{ fontWeight: 800, fontSize: "1.1rem", letterSpacing: "0.02em" }}>
                    {row.code}
                  </span>
                  <span
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      background: "rgba(15, 23, 42, 0.08)",
                      padding: "0.15rem 0.45rem",
                      borderRadius: 999,
                    }}
                  >
                    {row.family}
                  </span>
                </div>
                {row.has_articles ? (
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "#059669",
                      fontWeight: 600,
                    }}
                  >
                    {t("articlesBadge")}
                  </span>
                ) : null}
                <h2 style={{ margin: 0, fontSize: "1.05rem", lineHeight: 1.35 }}>{row.title}</h2>
                {row.excerpt ? (
                  <p style={{ margin: 0, color: "#64748b", fontSize: "0.9rem", lineHeight: 1.5 }}>
                    {row.excerpt.length > 180 ? `${row.excerpt.slice(0, 180)}…` : row.excerpt}
                  </p>
                ) : null}
              </article>
            </Link>
          ))}
        </div>
      )}

      {data.total_pages > 1 ? (
        <nav className="dtc-pagination" aria-label={t("pageLabel")}>
          <p className="dtc-pagination__summary">
            {t("pageSummary", {
              current: page,
              total: data.total_pages,
              count: data.count,
            })}
          </p>
          <div className="dtc-pagination__controls">
            {page <= 1 ? (
              <span className="dtc-pagination__link dtc-pagination__nav dtc-pagination__link--disabled">
                {t("prevPage")}
              </span>
            ) : (
              <Link
                href={`${linkBase}${buildQuery(baseQs, { page: String(page - 1) })}`}
                className="dtc-pagination__link dtc-pagination__nav"
                rel="prev"
              >
                {t("prevPage")}
              </Link>
            )}
            {paginationItems(page, data.total_pages).map((item, idx) =>
              item === "ellipsis" ? (
                <span key={`e-${idx}`} className="dtc-pagination__ellipsis" aria-hidden>
                  …
                </span>
              ) : item === page ? (
                <span
                  key={item}
                  className="dtc-pagination__link dtc-pagination__link--current"
                  aria-current="page"
                >
                  {item}
                </span>
              ) : (
                <Link
                  key={item}
                  href={`${linkBase}${buildQuery(baseQs, { page: String(item) })}`}
                  className="dtc-pagination__link"
                >
                  {item}
                </Link>
              ),
            )}
            {page >= data.total_pages ? (
              <span className="dtc-pagination__link dtc-pagination__nav dtc-pagination__link--disabled">
                {t("nextPage")}
              </span>
            ) : (
              <Link
                href={`${linkBase}${buildQuery(baseQs, { page: String(page + 1) })}`}
                className="dtc-pagination__link dtc-pagination__nav"
                rel="next"
              >
                {t("nextPage")}
              </Link>
            )}
          </div>
        </nav>
      ) : null}
    </div>
  );
}
