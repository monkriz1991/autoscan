import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { alternateLanguageUrls, localeToOpenGraphLocale } from "@/lib/site-url";

/**
 * Локализованные title/description + canonical/hreflang для публичных страниц.
 * pathWithoutLocale: "" для главной, иначе "/marketing/pricing", "/faq" и т.д.
 */
export async function buildLocalePageMetadata(
  locale: string,
  pathWithoutLocale: string,
  titleKey:
    | "homeTitle"
    | "pricingTitle"
    | "faqTitle"
    | "blogTitle"
    | "loginTitle"
    | "registerTitle"
    | "termsTitle"
    | "privacyTitle"
    | "contactsTitle"
    | "disclaimerTitle"
    | "checkoutTitle"
    | "downloadTitle",
  descriptionKey:
    | "homeDescription"
    | "pricingDescription"
    | "faqDescription"
    | "blogDescription"
    | "loginDescription"
    | "registerDescription"
    | "termsDescription"
    | "privacyDescription"
    | "contactsDescription"
    | "disclaimerDescription"
    | "checkoutDescription"
    | "downloadDescription",
  options?: { noindex?: boolean },
): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "seo" });
  const title = t(titleKey);
  const description = t(descriptionKey);
  const languages = alternateLanguageUrls(pathWithoutLocale);
  const url = languages[locale];
  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages,
    },
    openGraph: {
      title,
      description,
      url,
      locale: localeToOpenGraphLocale(locale),
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    ...(options?.noindex
      ? { robots: { index: false, follow: false, googleBot: { index: false, follow: false } } }
      : {}),
  };
}
