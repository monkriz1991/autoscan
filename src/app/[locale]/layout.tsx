import type { Metadata } from "next";
import { headers } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import {
  MIDDLEWARE_CANONICAL_SEARCH_HEADER,
  MIDDLEWARE_PATHNAME_HEADER,
  getLayoutChromeKind,
  isNoindexUtilityPath,
  shouldOmitLayoutGlobalJsonLd,
} from "@/lib/middleware-pathname";
import { getCanonicalUrlFromRequestHeaders } from "@/lib/request-canonical";
import { notFound } from "next/navigation";
import { staticOpenGraphImageAbsoluteUrl } from "@/lib/og-metadata";
import { alternateLanguageUrls, getMetadataBase, localeToOpenGraphLocale } from "@/lib/site-url";
import { MantineProvider, createTheme } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import JsonLd from "@/components/seo/JsonLd";
import RootLayoutContent from "@/components/ui/RootLayoutContent";
import CookieConsentBanner from "@/components/ui/CookieConsentBanner";
import GoogleAdsTag from "@/components/ui/GoogleAdsTag";
import GoogleAnalytics from "@/components/ui/GoogleAnalytics";
import LocaleHtmlLang from "@/components/ui/LocaleHtmlLang";
import { buildStaticGlobalStructuredData } from "@/lib/seo/static-structured-data";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@/styles/global.scss";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });
  const alternateLocales = routing.locales
    .filter((l) => l !== locale)
    .map((l) => localeToOpenGraphLocale(l));
  const ogImageUrl = staticOpenGraphImageAbsoluteUrl(locale);

  const h = await headers();
  const pathHeader = h.get(MIDDLEWARE_PATHNAME_HEADER) || "/";
  const pathNorm = pathHeader.replace(/\/+$/, "") || "/";
  const pathForAlternates = pathHeader === "/" || pathHeader === "" ? "" : pathHeader;
  const isNoindexPage = isNoindexUtilityPath(pathNorm);
  const canonicalUrl = await getCanonicalUrlFromRequestHeaders(locale);
  /** Только page= из query (без UTM) — те же alternate, что и канон пагинации DTC/блога. */
  const canonSearch = h.get(MIDDLEWARE_CANONICAL_SEARCH_HEADER) || "";
  const pageFromQuery = new URLSearchParams(canonSearch).get("page");
  const paginatedHreflangSuffix =
    (pathNorm === "/dtc" || pathNorm === "/blog") &&
    pageFromQuery &&
    /^\d+$/.test(pageFromQuery)
      ? `?page=${pageFromQuery}`
      : "";
  const alternates = isNoindexPage
    ? { canonical: canonicalUrl }
    : {
        canonical: canonicalUrl,
        languages: alternateLanguageUrls(pathForAlternates, paginatedHreflangSuffix),
      };
  const ogUrl = canonicalUrl;

  return {
    metadataBase: getMetadataBase(),
    title: {
      default: t("siteTitle"),
      template: `%s | ${t("siteName")}`,
    },
    description: t("defaultDescription"),
    alternates,
    robots: isNoindexPage
      ? {
          index: false,
          follow: false,
        }
      : undefined,
    openGraph: {
      type: "website",
      siteName: "AIscanAuto",
      title: t("siteTitle"),
      description: t("defaultDescription"),
      locale: localeToOpenGraphLocale(locale),
      alternateLocale: alternateLocales,
      url: ogUrl,
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: t("siteName") }],
    },
    twitter: {
      card: "summary_large_image",
      site: "@aiscanauto",
      title: t("siteTitle"),
      description: t("defaultDescription"),
      images: [{ url: ogImageUrl, alt: t("siteName") }],
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }
  setRequestLocale(locale);
  const messages = await getMessages();
  /** Без await к SEO API: быстрый RSC; глобальный JSON-LD совпадает с fallback из Django bundle `global`. */
  const globalLd = buildStaticGlobalStructuredData();

  const pathHeader = (await headers()).get(MIDDLEWARE_PATHNAME_HEADER);
  const chromeKindFromServer =
    pathHeader != null ? getLayoutChromeKind(pathHeader) : undefined;
  const omitGlobalLd = shouldOmitLayoutGlobalJsonLd(pathHeader ?? undefined);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {!omitGlobalLd ? <JsonLd data={globalLd} /> : null}
      <LocaleHtmlLang locale={locale} />
      <MantineProvider
        theme={createTheme({
          colors: {
            silver: [
              "#f8fafc",
              "#f1f5f9",
              "#e2e8f0",
              "#cbd5e1",
              "#94a3b8",
              "#64748b",
              "#475569",
              "#334155",
              "#1e293b",
              "#0f172a",
            ],
          },
          primaryColor: "silver",
          primaryShade: 6,
        })}
        defaultColorScheme="light"
      >
        <Notifications position="top-right" />
        <RootLayoutContent chromeKindFromServer={chromeKindFromServer}>{children}</RootLayoutContent>
        <GoogleAnalytics />
        <GoogleAdsTag />
        <CookieConsentBanner />
      </MantineProvider>
    </NextIntlClientProvider>
  );
}
