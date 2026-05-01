import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

/**
 * Генерация favicon через next/og — аналогично opengraph-image.tsx.
 * Next.js App Router автоматически использует /icon.tsx как /favicon.ico.
 */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(145deg, #0f172a 0%, #1e293b 100%)",
          borderRadius: "20%",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "#f8fafc",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <div style={{ fontSize: 220, fontWeight: 800, letterSpacing: "-0.04em", color: "#38bdf8" }}>
            A
          </div>
          <div style={{ fontSize: 48, fontWeight: 700, color: "#94a3b8", marginTop: -20 }}>
            AI
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
