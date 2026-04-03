import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { notFound } from "next/navigation";
import { getMetadataBase, localeToOpenGraphLocale } from "@/lib/site-url";
import { MantineProvider, createTheme } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import RootLayoutContent from "@/components/ui/RootLayoutContent";
import CookieConsentBanner from "@/components/ui/CookieConsentBanner";
import GoogleAnalytics from "@/components/ui/GoogleAnalytics";
import LocaleHtmlLang from "@/components/ui/LocaleHtmlLang";
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
  return {
    metadataBase: getMetadataBase(),
    title: {
      default: t("siteTitle"),
      template: `%s | ${t("siteName")}`,
    },
    description: t("defaultDescription"),
    openGraph: {
      type: "website",
      siteName: t("siteName"),
      locale: localeToOpenGraphLocale(locale),
      alternateLocale: alternateLocales,
    },
    twitter: {
      card: "summary_large_image",
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

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
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
        <RootLayoutContent>{children}</RootLayoutContent>
        <GoogleAnalytics />
        <CookieConsentBanner />
      </MantineProvider>
    </NextIntlClientProvider>
  );
}
