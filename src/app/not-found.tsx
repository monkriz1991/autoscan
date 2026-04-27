import type { Metadata } from "next";
import Link from "next/link";

/** Резерв для путей вне `[locale]` (редко); основная 404 — `src/app/[locale]/not-found.tsx`. */
export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

export default function RootNotFound() {
  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <h1>Page not found</h1>
      <p>The page you requested does not exist.</p>
      <p>
        <Link href="/">Go to home</Link>
      </p>
    </main>
  );
}
