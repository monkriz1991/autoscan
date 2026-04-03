import type { Metadata, Viewport } from "next";

/** Детальные title/description задаются в [locale]/layout и страницах. */
export const metadata: Metadata = {
  applicationName: "AutoScan",
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
