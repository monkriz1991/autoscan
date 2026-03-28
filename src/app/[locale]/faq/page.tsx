import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import FaqPageContent from "./FaqPageContent";

type Props = { params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function FaqPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <Suspense fallback={null}>
      <FaqPageContent />
    </Suspense>
  );
}
