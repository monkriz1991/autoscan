/**
 * Статический JSON-LD при недоступности API /seo/structured-data/ (fallback для SSR).
 * Формат @id совпадает с Django (apps.seo.builders.organization / website).
 */

import { routing } from "@/i18n/routing";
import { getSiteOrigin, localizedPath } from "@/lib/site-url";
import { mergeStructuredDataDocs, type StructuredDataDoc } from "@/lib/seo/structured-data";

function publicSiteName(): string {
  return (process.env.NEXT_PUBLIC_SITE_NAME || "AIscanAuto").trim();
}

function publicLogoUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_LOGO_URL || "").trim();
}

function publicContactEmail(): string {
  return (process.env.NEXT_PUBLIC_SITE_CONTACT_EMAIL || "").trim();
}

function publicSocialLinks(): string[] {
  const raw = process.env.NEXT_PUBLIC_SITE_SOCIAL_LINKS || "";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** WebSite с SearchAction, если задано NEXT_PUBLIC_SEO_SEARCH_ENABLED=true (как SEO_SEARCH_ENABLED на бэкенде). */
function websiteSearchAction(base: string) {
  if (process.env.NEXT_PUBLIC_SEO_SEARCH_ENABLED !== "true") {
    return undefined;
  }
  return {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${base}/search?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  };
}

/**
 * Organization + WebSite — эквивалент bundle `global` с бэкенда (упрощённо, без данных только на сервере).
 */
export function buildStaticGlobalStructuredData(): StructuredDataDoc {
  const base = getSiteOrigin();
  const orgId = `${base}/#organization`;
  const siteId = `${base}/#website`;
  const name = publicSiteName();
  const email = publicContactEmail();
  const logo = publicLogoUrl();
  const sameAs = publicSocialLinks();

  const organization: Record<string, unknown> = {
    "@type": "Organization",
    "@id": orgId,
    name,
    url: base,
  };
  if (logo) organization.logo = logo;
  if (email) organization.email = email;
  if (sameAs.length) organization.sameAs = sameAs;
  if (email) {
    organization.contactPoint = [
      {
        "@type": "ContactPoint",
        contactType: "customer service",
        email,
        availableLanguage: [...routing.locales],
      },
    ];
  }

  const website: Record<string, unknown> = {
    "@type": "WebSite",
    "@id": siteId,
    url: base,
    name,
    publisher: { "@id": orgId },
  };
  const search = websiteSearchAction(base);
  if (search) website.potentialAction = search;

  return {
    "@context": "https://schema.org",
    "@graph": [organization, website],
  };
}

/** WebPage главной — эквивалент bundle `home` (одна сущность). */
export function buildStaticHomeStructuredData(params: {
  pageUrl: string;
  title: string;
  description: string;
}): StructuredDataDoc {
  const url = params.pageUrl.replace(/\/$/, "");
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        url,
        name: params.title,
        description: params.description,
      },
    ],
  };
}

function publicSoftwareAppName(): string {
  return (process.env.NEXT_PUBLIC_SEO_SOFTWARE_APP_NAME || "").trim() || publicSiteName();
}

function publicSoftwareDescription(): string {
  return (
    (process.env.NEXT_PUBLIC_SEO_SOFTWARE_DESCRIPTION || "").trim() ||
    "AI-powered OBD2 car diagnostics: read DTCs, live data, and repair guidance."
  );
}

function publicSoftwareOfferDescription(): string {
  return (
    (process.env.NEXT_PUBLIC_SEO_SOFTWARE_OFFER_DESCRIPTION || "").trim() ||
    "Free tier available; paid plans for more devices and AI requests."
  );
}

function publicSoftwareFeatureList(): string[] {
  try {
    const raw = (process.env.NEXT_PUBLIC_SEO_SOFTWARE_FEATURE_LIST_JSON || "[]").trim();
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return [];
    return arr.map((x) => String(x).trim()).filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * SoftwareApplication для страницы (главная и т.д.) — fallback без SEO API.
 * Логика близка к apps.seo.builders.software_application._build_fallback_node.
 */
export function buildStaticSoftwareApplicationStructuredData(params: {
  pageUrl: string;
  locale: string;
}): StructuredDataDoc {
  const url = params.pageUrl.replace(/\/$/, "");
  const base = getSiteOrigin();
  const offerRel = localizedPath(params.locale, "/pricing");
  const offerUrl = `${base}${offerRel}`;

  const node: Record<string, unknown> = {
    "@type": "SoftwareApplication",
    "@id": `${url}#software`,
    name: publicSoftwareAppName(),
    applicationCategory: "AutomotiveApplication",
    operatingSystem: "Windows, macOS, Linux, Android, iOS",
    description: publicSoftwareDescription(),
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description: publicSoftwareOfferDescription(),
      url: offerUrl,
    },
  };
  const feats = publicSoftwareFeatureList();
  if (feats.length) node.featureList = feats;
  return {
    "@context": "https://schema.org",
    "@graph": [node],
  };
}

/** WebPage + SoftwareApplication для главной при недоступности бэкенда. */
export function buildStaticHomeWithSoftwareStructuredData(params: {
  pageUrl: string;
  locale: string;
  title: string;
  description: string;
}): StructuredDataDoc {
  const homePart = buildStaticHomeStructuredData({
    pageUrl: params.pageUrl,
    title: params.title,
    description: params.description,
  });
  const appPart = buildStaticSoftwareApplicationStructuredData({
    pageUrl: params.pageUrl,
    locale: params.locale,
  });
  return mergeStructuredDataDocs(homePart, appPart);
}

/**
 * Та же WebPage-схема для маркетинговых маршрутов (/pricing и т.д.) без запроса к API SEO.
 */
export function buildStaticWebPageStructuredData(params: {
  pageUrl: string;
  title: string;
  description: string;
}): StructuredDataDoc {
  return buildStaticHomeStructuredData(params);
}

/** Article для поста блога без удалённого bundle `blog_post` (SSR без блокировки на SEO API). */
export function buildStaticBlogArticleStructuredData(params: {
  pageUrl: string;
  title: string;
  description: string;
  datePublished: string;
  dateModified: string;
  imageAbsoluteUrl: string;
}): StructuredDataDoc {
  const base = getSiteOrigin();
  const orgId = `${base}/#organization`;
  const name = publicSiteName();
  const logoUrl = publicLogoUrl() || `${base}/icon.png`;
  const url = params.pageUrl.replace(/\/$/, "");
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${url}#article`,
        headline: params.title,
        description: params.description,
        url,
        datePublished: params.datePublished,
        dateModified: params.dateModified,
        author: {
          "@type": "Organization",
          name,
          url: base,
        },
        publisher: {
          "@type": "Organization",
          "@id": orgId,
          name,
          logo: { "@type": "ImageObject", url: logoUrl },
        },
        image: {
          "@type": "ImageObject",
          url: params.imageAbsoluteUrl,
        },
      },
    ],
  };
}
