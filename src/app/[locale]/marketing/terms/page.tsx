import { permanentRedirect } from "next/navigation";
import { localizedPath } from "@/lib/site-url";

/** Легаси URL — канонический путь без `/marketing`. */
export default async function LegacyMarketingTermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  permanentRedirect(localizedPath(locale, "/terms"));
}
