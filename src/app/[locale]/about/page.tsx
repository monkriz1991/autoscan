import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import JsonLd from "@/components/seo/JsonLd";
import { routing } from "@/i18n/routing";
import { mergeStructuredDataDocs } from "@/lib/seo/structured-data";
import {
  buildStaticAboutStructuredData,
  buildStaticGlobalStructuredData,
} from "@/lib/seo/static-structured-data";
import { buildLocalePageMetadata } from "@/lib/seo-metadata";
import { generateCanonicalUrlForLocale } from "@/lib/site-url";
import { buildTitle } from "@/lib/seo/titles";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const absoluteTitle = buildTitle.about();
  const base = await buildLocalePageMetadata(locale, "/about", "aboutTitle", "aboutDescription", {
    pageTitleOverride: absoluteTitle,
  });
  return { ...base, title: { absolute: absoluteTitle } };
}

/** О компании и авторе блога (E-E-A-T); якорь #author-valenchits-a совпадает с JSON-LD Person. */
export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "aboutPage" });
  const tSeo = await getTranslations({ locale, namespace: "seo" });
  const pageUrl = generateCanonicalUrlForLocale(locale, "/about");
  const aboutLd = mergeStructuredDataDocs(
    buildStaticGlobalStructuredData(),
    buildStaticAboutStructuredData({
      pageUrl,
      title: t("title"),
      description: tSeo("aboutDescription"),
    }),
  );

  return (
    <>
      <JsonLd data={aboutLd} />
      <div className="container" style={{ padding: "1rem 0 2rem", maxWidth: "48rem" }}>
        <h1>{t("title")}</h1>
        <p style={{ lineHeight: 1.65, color: "#495057" }}>{t("lead")}</p>
        <h2 style={{ marginTop: "2rem" }}>{t("missionTitle")}</h2>
        <p style={{ lineHeight: 1.65, color: "#495057" }}>{t("missionBody")}</p>
        <section id="author-valenchits-a" style={{ marginTop: "2rem" }} aria-labelledby="about-author-heading">
          <h2 id="about-author-heading">{t("authorHeading")}</h2>
          <p style={{ lineHeight: 1.65, color: "#495057" }}>{t("authorBio")}</p>
        </section>
      </div>
    </>
  );
}
