import type { Metadata } from "next";
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { localizedPath } from "@/lib/site-url";
import { staticOpenGraphImageAbsoluteUrl } from "@/lib/og-metadata";

export const metadata: Metadata = {
  title: "404",
  robots: { index: false, follow: true },
  openGraph: {
    type: "website",
    siteName: "AIscanAuto",
    title: "404 — Page not found",
    description: "The page you are looking for does not exist.",
    locale: "en_US",
    images: [
      {
        url: staticOpenGraphImageAbsoluteUrl("en"),
        width: 1200,
        height: 630,
        alt: "AIscanAuto",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@aiscanauto",
    title: "404 — Page not found",
    description: "The page you are looking for does not exist.",
    images: [
      {
        url: staticOpenGraphImageAbsoluteUrl("en"),
        alt: "AIscanAuto",
      },
    ],
  },
};

export default async function NotFound() {
  const locale = (await headers()).get("x-next-intl-locale") || "en";
  const t = await getTranslations({ locale, namespace: "notFound" });

  return (
    <div
      style={{
        maxWidth: "32rem",
        margin: "0 auto",
        padding: "4rem 1.25rem",
        fontFamily:
          'system-ui, -apple-system, "Segoe UI", Roboto, Ubuntu, sans-serif',
        color: "#e8eef5",
        lineHeight: 1.6,
      }}
    >
      <h1
        style={{
          fontSize: "1.75rem",
          fontWeight: 700,
          margin: "0 0 0.5rem",
          color: "#e8eef5",
        }}
      >
        {t("title")}
      </h1>
      <p style={{ color: "#8b9cb3", fontSize: "1.05rem", margin: "0 0 1.5rem" }}>
        {t("description")}
      </p>
      <a
        href={localizedPath(locale, "/")}
        className="btn-cta-primary"
        style={{
          display: "inline-block",
          padding: "0.6rem 1.2rem",
          borderRadius: "8px",
          textDecoration: "none",
          fontWeight: 600,
        }}
      >
        {t("backHome")}
      </a>
    </div>
  );
}
