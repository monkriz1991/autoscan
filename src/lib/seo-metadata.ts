import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildOpenGraphTwitterBlock, staticOpenGraphImageAbsoluteUrl } from "@/lib/og-metadata";
import {
  alternateLanguageUrls,
  generateCanonicalUrl,
  localizedPath,
} from "@/lib/site-url";

/**
 * Локализованные title/description + canonical/hreflang для публичных страниц.
 * pathWithoutLocale: "" для главной, иначе "/pricing", "/faq" и т.д.
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
  options?: {
    noindex?: boolean;
    /** При noindex: true — noindex,follow (юридические страницы в футере); иначе noindex,nofollow как у login. */
    robotsFollowWhenNoindex?: boolean;
    canonicalQuery?: Record<string, string | undefined>;
  },
): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "seo" });
  const title = t(titleKey);
  const description = t(descriptionKey);
  const languages = alternateLanguageUrls(pathWithoutLocale);
  let canonical = languages[locale];
  if (options?.canonicalQuery) {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(options.canonicalQuery)) {
      if (v) qs.set(k, v);
    }
    const q = qs.toString();
    if (q) {
      canonical = generateCanonicalUrl(`${localizedPath(locale, pathWithoutLocale)}?${q}`);
    }
  }

  const ogTw = buildOpenGraphTwitterBlock({
    locale,
    title,
    description,
    url: canonical,
    imageUrl: staticOpenGraphImageAbsoluteUrl(locale),
  });

  let robotsNoindex: Metadata["robots"] | undefined;
  if (options?.noindex === true) {
    const follow = options.robotsFollowWhenNoindex === true;
    robotsNoindex = {
      index: false,
      follow,
      googleBot: { index: false, follow },
    };
  }

  return {
    title,
    description,
    alternates: {
      canonical,
      languages,
    },
    ...ogTw,
    ...(robotsNoindex !== undefined ? { robots: robotsNoindex } : {}),
  };
}
