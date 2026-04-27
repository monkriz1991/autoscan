import { permanentRedirect } from "next/navigation";
import { routing } from "@/i18n/routing";

/** Легаси-URL: постоянный редирект на канонический `/pricing`. */
export default async function LegacyMarketingPricingRedirect({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;
  permanentRedirect(`${prefix}/pricing`);
}

export function generateStaticParams() {
  return routing.locales.map((loc) => ({ locale: loc }));
}
