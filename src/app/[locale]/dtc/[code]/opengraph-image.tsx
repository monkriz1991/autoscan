import { ImageResponse } from "next/og";

export const alt = "AIscanAuto DTC";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** OG на лету для любого кода (см. страница DTC, ISR). */
export const dynamic = "force-dynamic";

/**
 * Динамический OG для DTC: логотип + код + краткий текст + предупреждение.
 */
export default async function Image({ params }: { params: Promise<{ locale: string; code: string }> }) {
  const { code } = await params;
  const upper = code.toUpperCase();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(125deg, #0c1222 0%, #1a2744 50%, #0f172a 100%)",
          color: "#f1f5f9",
          padding: 48,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 38, fontWeight: 700 }}>AIscanAuto</span>
          <span style={{ fontSize: 120 }}>⚠</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 132, fontWeight: 800, letterSpacing: "-0.04em", color: "#38bdf8" }}>{upper}</div>
          <div style={{ fontSize: 32, color: "#94a3b8", maxWidth: 900, lineHeight: 1.35 }}>
            OBD2 diagnostic trouble code — scan with AIscanAuto for causes, live data and repair hints.
          </div>
        </div>

        <div style={{ display: "flex", fontSize: 22, color: "#64748b" }}>{`aiscanauto.com/dtc/${upper}`}</div>
      </div>
    ),
    { ...size },
  );
}
