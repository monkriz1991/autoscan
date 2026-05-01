import { ImageResponse } from "next/og";

export const alt = "AIscanAuto Blog";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const dynamic = "force-dynamic";

function slugToTitle(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

async function fetchBlogTitle(slug: string, locale: string): Promise<string | null> {
  try {
    const base = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8001/api/v1").replace(
      /\/$/,
      "",
    );
    const url = `${base}/blog/${encodeURIComponent(slug)}/`;
    const res = await fetch(url, {
      credentials: "omit",
      headers: {
        "Accept-Language": locale,
        "X-Locale": locale,
      },
      next: { revalidate: 120 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Record<string, unknown>;
    const title = String(data.localized_title_raw ?? data.title ?? "").trim();
    return title || null;
  } catch {
    return null;
  }
}

/**
 * OG для статьи блога: mock UI + tagline + заголовок из API (с fallback на slug).
 */
export default async function Image({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const apiTitle = await fetchBlogTitle(slug, locale);
  const title = apiTitle || slugToTitle(slug);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(145deg, #0f172a 0%, #1e3a5f 55%, #0f172a 100%)",
          color: "#f8fafc",
          padding: 52,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 36, fontWeight: 700 }}>AIscanAuto</span>
          <span style={{ fontSize: 24, color: "#94a3b8" }}>Blog</span>
        </div>

        <div style={{ display: "flex", gap: 40, alignItems: "stretch", flex: 1, marginTop: 24 }}>
          <div
            style={{
              width: 440,
              borderRadius: 16,
              background: "rgba(15,23,42,0.9)",
              border: "1px solid rgba(148,163,184,0.3)",
              padding: 20,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div style={{ height: 10, width: "70%", borderRadius: 6, background: "#475569" }} />
            <div style={{ flex: 1, borderRadius: 10, background: "linear-gradient(180deg,#1e293b,#0f172a)" }} />
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 20, justifyContent: "center" }}>
            <div style={{ fontSize: 44, fontWeight: 700, lineHeight: 1.2 }}>{title}</div>
            <div style={{ fontSize: 30, color: "#bae6fd", fontWeight: 600 }}>Free AI Car Diagnostics</div>
            <div style={{ fontSize: 24, color: "#94a3b8", lineHeight: 1.4 }}>
              Guides and updates — OBD2, ELM327, AI diagnostics.
            </div>
          </div>
        </div>

        <div style={{ fontSize: 20, color: "#64748b" }}>aiscanauto.com</div>
      </div>
    ),
    { ...size },
  );
}
