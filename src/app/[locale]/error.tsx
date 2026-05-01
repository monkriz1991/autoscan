"use client";

import { useEffect } from "react";

/**
 * Error boundary для `[locale]` сегмента.
 * Next.js Error Component — автоматически оборачивает страницы при ошибках рендера.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("[locale] error boundary:", error);
  }, [error]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        gap: "1.5rem",
        padding: "2rem",
        textAlign: "center",
      }}
    >
      <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#1e293b", margin: 0 }}>
        Something went wrong
      </h2>
      <p style={{ color: "#64748b", maxWidth: 400, margin: 0 }}>
        We encountered an error while loading this page. Please try again or go back to the
        homepage.
      </p>
      <div style={{ display: "flex", gap: "1rem" }}>
        <button
          onClick={reset}
          style={{
            padding: "0.75rem 1.5rem",
            borderRadius: 8,
            border: "none",
            background: "#38bdf8",
            color: "#fff",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
        <a
          href="/"
          style={{
            padding: "0.75rem 1.5rem",
            borderRadius: 8,
            border: "1px solid #cbd5e1",
            background: "transparent",
            color: "#334155",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Go home
        </a>
      </div>
      {error.digest && (
        <code
          style={{
            fontSize: "0.75rem",
            color: "#94a3b8",
            background: "#f1f5f9",
            padding: "0.25rem 0.5rem",
            borderRadius: 4,
          }}
        >
          Error ID: {error.digest}
        </code>
      )}
    </div>
  );
}
