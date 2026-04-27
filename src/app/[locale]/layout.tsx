import type { Metadata } from "next";
import { headers } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { MIDDLEWARE_PATHNAME_HEADER, getLayoutChromeKind } from "@/lib/middleware-pathname";
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
import {
  fetchStructuredData,
  withStructuredDataFallback,
} from "@/lib/seo/structured-data";
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

  const pathHeader = (await headers()).get(MIDDLEWARE_PATHNAME_HEADER) || "/";
  const pathForAlternates = pathHeader === "/" || pathHeader === "" ? "" : pathHeader;
  const canonicalUrl = await getCanonicalUrlFromRequestHeaders(locale);
  /** hreflang: см. `getAlternateLanguages` в `@/lib/site-url` (здесь — запись для Metadata `alternates.languages`). */
  const languages = alternateLanguageUrls(pathForAlternates);
  const ogUrl = canonicalUrl;

  return {
    metadataBase: getMetadataBase(),
    title: {
      default: t("siteTitle"),
      template: `%s | ${t("siteName")}`,
    },
    description: t("defaultDescription"),
    alternates: {
      canonical: canonicalUrl,
      languages,
    },
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
      title: t("siteTitle"),
      description: t("defaultDescription"),
      images: [ogImageUrl],
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
  const globalLdRaw = await fetchStructuredData({ bundles: ["global"], locale });
  const globalLd = withStructuredDataFallback(globalLdRaw, buildStaticGlobalStructuredData());

  const pathHeader = (await headers()).get(MIDDLEWARE_PATHNAME_HEADER);
  const chromeKindFromServer =
    pathHeader != null ? getLayoutChromeKind(pathHeader) : undefined;

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <JsonLd data={globalLd} />
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
