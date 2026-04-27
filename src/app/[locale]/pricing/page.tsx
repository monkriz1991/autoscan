import { permanentRedirect } from "next/navigation";
import { routing } from "@/i18n/routing";

export default async function PricingRedirectPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;
  permanentRedirect(`${prefix}/marketing/pricing`);
}

export function generateStaticParams() {
  return routing.locales.map((loc) => ({ locale: loc }));
}
