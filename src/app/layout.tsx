import type { Metadata, Viewport } from "next";

/** Детальные title/description задаются в [locale]/layout и страницах. */
export const metadata: Metadata = {
  applicationName: "AutoScan",
  description:
    "Free AI-powered OBD2 scanner for Windows, macOS & Linux. Plug in any ELM327 adapter, read fault codes, monitor live engine data, and get plain-language repair guidance from AI. Works with 99% of cars (1996+).",
  referrer: "strict-origin-when-cross-origin",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
