import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { getLocaleFromRequestPathname } from "@/lib/request-locale";
import { getMetadataBase } from "@/lib/site-url";

const inter = Inter({
  subsets: ["latin", "cyrillic", "latin-ext"],
  display: "swap",
  variable: "--font-inter",
  adjustFontFallback: true,
});

/** Детальные title/description задаются в [locale]/layout и страницах. */
export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  applicationName: "AIscanAuto",
  title: {
    template: "%s | AiScanAuto - AI Car Diagnostics",
    default: "AiScanAuto - AI-Powered OBD2 Car Diagnostics",
  },
  description:
    "Free AI-powered OBD2 scanner for Windows, macOS & Linux. Plug in any ELM327 adapter, read fault codes, monitor live engine data, and get plain-language repair guidance from AI. Works with 99% of cars (1996+).",
  referrer: "strict-origin-when-cross-origin",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const lang = await getLocaleFromRequestPathname();

  return (
    <html lang={lang} suppressHydrationWarning className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
