/**
 * Skeleton loading state для async RSC в `[locale]` сегменте.
 * Next.js автоматически показывает это при загрузке страницы.
 */
export default function Loading() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        gap: "1rem",
        padding: "2rem",
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          border: "3px solid #e2e8f0",
          borderTopColor: "#38bdf8",
          animation: "spin 1s linear infinite",
        }}
      />
      <div
        style={{
          width: 200,
          height: 16,
          borderRadius: 8,
          background: "linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%)",
          backgroundSize: "200% 100%",
          animation: "shimmer 1.5s infinite",
        }}
      />
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
