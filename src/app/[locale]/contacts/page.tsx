import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildLocalePageMetadata } from "@/lib/seo-metadata";
import { buildTitle } from "@/lib/seo/titles";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const absoluteTitle = buildTitle.contacts();
  const base = await buildLocalePageMetadata(
    locale,
    "/contacts",
    "contactsTitle",
    "contactsDescription",
    { pageTitleOverride: absoluteTitle },
  );
  return { ...base, title: { absolute: absoluteTitle } };
}

/** Локализованная заглушка; реквизиты и каналы связи добавят позже. */
export default async function ContactsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "contactsPage" });

  return (
    <div className="container" style={{ padding: "1rem 0 2rem", maxWidth: "48rem" }}>
      <h1>{t("title")}</h1>
      <p style={{ lineHeight: 1.65, color: "#495057" }}>{t("lead")}</p>
    </div>
  );
}
