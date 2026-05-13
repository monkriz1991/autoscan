import { ImageResponse } from "next/og";
import { routing } from "@/i18n/routing";

export const alt = "AIscanAuto — Free AI Car Diagnostics";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/**
 * Статический OG: mock UI + tagline (главная, FAQ, Download, список блога и др.).
 */
export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  await params;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(145deg, #0f172a 0%, #1e293b 45%, #334155 100%)",
          color: "#f8fafc",
          padding: 56,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <span style={{ fontSize: 42, fontWeight: 700, letterSpacing: "-0.02em" }}>AIscanAuto</span>
          <span style={{ fontSize: 22, color: "#94a3b8" }}>OBD2 · AI</span>
        </div>

        <div style={{ display: "flex", gap: 36, alignItems: "center" }}>
          {/* Mock «скрин» интерфейса */}
          <div
            style={{
              width: 520,
              height: 340,
              borderRadius: 16,
              background: "rgba(15,23,42,0.85)",
              border: "1px solid rgba(148,163,184,0.35)",
              display: "flex",
              flexDirection: "column",
              padding: 24,
              gap: 16,
            }}
          >
            <div style={{ height: 12, width: "55%", borderRadius: 6, background: "#475569" }} />
            <div style={{ height: 10, width: "90%", borderRadius: 6, background: "#334155" }} />
            <div style={{ height: 10, width: "80%", borderRadius: 6, background: "#334155" }} />
            <div style={{ flex: 1, borderRadius: 12, background: "linear-gradient(180deg,#1e293b,#0f172a)" }} />
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ height: 36, flex: 1, borderRadius: 8, background: "#64748b" }} />
              <div style={{ height: 36, width: 120, borderRadius: 8, background: "#3b82f6" }} />
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 20, flex: 1 }}>
            <div style={{ fontSize: 48, fontWeight: 700, lineHeight: 1.15 }}>
              Free AI Car Diagnostics
            </div>
            <div style={{ fontSize: 26, color: "#cbd5e1", lineHeight: 1.4 }}>
              Read DTCs, live data, ELM327 — AI repair hints on phone and desktop.
            </div>
          </div>
        </div>

        <div style={{ fontSize: 20, color: "#64748b" }}>aiscanauto.com</div>
      </div>
    ),
    {
      ...size,
      headers: {
        "X-Robots-Tag": "noindex, noimageindex",
      },
    },
  );
}
