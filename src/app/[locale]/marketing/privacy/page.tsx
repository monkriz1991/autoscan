import { getTranslations } from "next-intl/server";

/** Локализованная заглушка; полный текст политики подготовит юридический отдел. */
export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "privacyPage" });

  return (
    <div className="container" style={{ padding: "1rem 0 2rem", maxWidth: "48rem" }}>
      <h1>{t("title")}</h1>
      <p style={{ lineHeight: 1.65, color: "#495057" }}>{t("lead")}</p>
    </div>
  );
}
