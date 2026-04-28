/** Плейсхолдер сетки постов, пока ждём GET /blog/. */
export default function BlogPostsSkeleton() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
        gap: "1rem",
      }}
    >
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            minHeight: 280,
            borderRadius: "1rem",
            background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
            border: "1px solid #e2e8f0",
          }}
        />
      ))}
    </div>
  );
}
