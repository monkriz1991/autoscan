import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AutoScan",
  description: "AI diagnostics for vehicles",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
