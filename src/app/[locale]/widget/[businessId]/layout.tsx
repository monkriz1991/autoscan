import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

/**
 * Виджет записи — только для встраивания; не индексируем, без hreflang-кластера (см. isNoindexUtilityPath).
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });
  return {
    title: t("widgetEmbedTitle"),
    robots: { index: false, follow: false },
  };
}

export default function WidgetSegmentLayout({ children }: { children: React.ReactNode }) {
  return children;
}
