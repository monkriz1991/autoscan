import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

/**
 * OAuth / magic-link / callback — служебные маршруты: не индексировать.
 * Заголовок совпадает с входом (единый UX); hreflang может наследоваться из [locale]/layout,
 * но robots:noindex исключает страницу из индекса.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });
  return {
    title: t("loginTitle"),
    robots: {
      index: false,
      follow: true,
      googleBot: { index: false, follow: true },
    },
  };
}

export default function AuthSegmentLayout({ children }: { children: React.ReactNode }) {
  return children;
}
