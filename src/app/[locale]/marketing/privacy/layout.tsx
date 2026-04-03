import type { Metadata } from "next";
import { buildLocalePageMetadata } from "@/lib/seo-metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildLocalePageMetadata(locale, "/marketing/privacy", "privacyTitle", "privacyDescription");
}

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
