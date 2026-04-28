/**
 * Оболочка страницы «Скачать» пока ждём SSR GET downloads/page (не блокируем первый HTML целиком).
 */
export default function DownloadPageSkeleton() {
  return (
    <div className="marketing-page marketing-page--wide">
      <div className="marketing-page__hero">
        <div
          style={{
            height: 44,
            maxWidth: 360,
            borderRadius: 8,
            background: "#e2e8f0",
            marginBottom: 12,
          }}
        />
        <div style={{ height: 22, maxWidth: 520, borderRadius: 6, background: "#f1f5f9" }} />
      </div>
      <div style={{ display: "grid", gap: "1rem", marginTop: 24 }}>
        <div style={{ height: 120, borderRadius: 12, background: "linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)", backgroundSize: "200% 100%" }} />
        <div style={{ height: 200, borderRadius: 12, background: "#f8fafc", border: "1px solid #e2e8f0" }} />
      </div>
    </div>
  );
}
