import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { notFound } from "next/navigation";
import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import RootLayoutContent from "@/components/ui/RootLayoutContent";
import LocaleHtmlLang from "@/components/ui/LocaleHtmlLang";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@/styles/global.scss";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
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
      <MantineProvider defaultColorScheme="light">
        <Notifications position="top-right" />
        <RootLayoutContent>{children}</RootLayoutContent>
      </MantineProvider>
    </NextIntlClientProvider>
  );
}
