import { getTranslations } from "next-intl/server";

/** Страница юридического отказа от ответственности (полный текст в messages). */
export default async function DisclaimerPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "disclaimerPage" });
  const paragraphStyle = { lineHeight: 1.65 as const, color: "#495057", marginBottom: "1rem" };

  return (
    <div className="container" style={{ padding: "1rem 0 2rem", maxWidth: "48rem" }}>
      <h1>{t("title")}</h1>
      <p style={paragraphStyle}>{t("p1")}</p>
      <p style={paragraphStyle}>{t("p2")}</p>
      <p style={paragraphStyle}>{t("p3")}</p>
      <p style={{ ...paragraphStyle, marginBottom: 0 }}>{t("p4")}</p>
    </div>
  );
}
