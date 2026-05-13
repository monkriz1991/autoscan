/**
 * Статический JSON-LD при недоступности API /seo/structured-data/ (fallback для SSR).
 * Формат @id совпадает с Django (apps.seo.builders.organization / website).
 */

import { routing } from "@/i18n/routing";
import { getSiteOrigin, localizedPath } from "@/lib/site-url";
import { mergeStructuredDataDocs, type StructuredDataDoc } from "@/lib/seo/structured-data";

/** Каноническое имя бренда в JSON-LD (совпадает с Django SEO_SITE_NAME по умолчанию). */
export const CANONICAL_SEO_SITE_NAME = "AIscanAuto" as const;

/**
 * Единое написание бренда в Organization/WebSite/Article: пустой env и известные варианты «AiScanAuto» → канон.
 * Иное непустое имя не трогаем (реальный ребрендинг).
 */
export function normalizePublicSiteName(raw: string): string {
  const t = (raw ?? "").trim();
  if (!t) return CANONICAL_SEO_SITE_NAME;
  const key = t.toLowerCase().replace(/\s+/g, "");
  if (key === "aiscanauto") return CANONICAL_SEO_SITE_NAME;
  return t;
}

function publicSiteName(): string {
  return normalizePublicSiteName(process.env.NEXT_PUBLIC_SITE_NAME || "");
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

/** Стабильный @id автора блога (E-E-A-T, Person + sameAs) — фрагмент на странице /about. */
export const BLOG_AUTHOR_PERSON_NAME = "valenchits A" as const;

export function blogAuthorPersonId(base: string): string {
  return `${base.replace(/\/$/, "")}/about#author-valenchits-a`;
}

/** WebSite с SearchAction (Sitelinks Search Box) — всегда, путь поиска совпадает с бэкендом. */
function websiteSearchAction(base: string) {
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
    potentialAction: websiteSearchAction(base),
    // GSC: CreativeWork-подтипы с ожиданием image на части шаблонов
    image: `${base}/og-image.webp`,
  };

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
  const og = `${getSiteOrigin()}/og-image.webp`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        url,
        name: params.title,
        description: params.description,
        primaryImageOfPage: { "@type": "ImageObject", url: og },
      },
    ],
  };
}

function publicSoftwareAppName(): string {
  const t = (process.env.NEXT_PUBLIC_SEO_SOFTWARE_APP_NAME || "").trim();
  if (!t) return publicSiteName();
  const key = t.toLowerCase().replace(/\s+/g, "");
  if (key === "aiscanauto") return CANONICAL_SEO_SITE_NAME;
  return t;
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

/** AggregateRating из публичных env (паритет с Django SEO_AGGREGATE_RATING_*). */
export function optionalPublicAggregateRatingNode(): Record<string, unknown> | null {
  const rawVal = (process.env.NEXT_PUBLIC_SEO_AGGREGATE_RATING_VALUE ?? "").trim();
  const rawCount = (process.env.NEXT_PUBLIC_SEO_AGGREGATE_RATING_COUNT ?? "").trim();
  if (!rawVal || !rawCount) return null;
  const count = Number.parseInt(rawCount, 10);
  if (!Number.isFinite(count) || count <= 0) return null;
  const normalized = rawVal.replace(",", ".");
  const num = Number.parseFloat(normalized);
  if (!Number.isFinite(num) || num <= 0) return null;
  return {
    "@type": "AggregateRating",
    ratingValue: normalized,
    ratingCount: count,
  };
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
    image: `${base}/og-image.webp`,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description: publicSoftwareOfferDescription(),
      url: offerUrl,
      availability: "https://schema.org/InStock",
    },
  };
  const feats = publicSoftwareFeatureList();
  if (feats.length) node.featureList = feats;
  const agg = optionalPublicAggregateRatingNode();
  if (agg !== null) {
    node.aggregateRating = agg;
  }
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

/**
 * WebPage + Person автора для /about (E-E-A-T, совпадает @id с блог-постами).
 * Склеивать с `buildStaticGlobalStructuredData` через mergeStructuredDataDocs.
 */
export type BreadcrumbListItemInput = { name: string; url: string };

/**
 * BreadcrumbList для JSON-LD (крошки в выдаче). `items` — по порядку; URL абсолютные (как canonical).
 */
export function buildBreadcrumbListStructuredData(
  pageUrl: string,
  items: BreadcrumbListItemInput[],
): StructuredDataDoc {
  const page = pageUrl.replace(/\/$/, "");
  const elements = items.map((row, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: row.name.trim() || "—",
    item: row.url.replace(/\/$/, ""),
  }));
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "@id": `${page}#breadcrumb`,
        itemListElement: elements,
      },
    ],
  };
}

export function buildStaticAboutStructuredData(params: {
  pageUrl: string;
  title: string;
  description: string;
}): StructuredDataDoc {
  const base = getSiteOrigin();
  const url = params.pageUrl.replace(/\/$/, "");
  const personId = blogAuthorPersonId(base);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": personId,
        name: BLOG_AUTHOR_PERSON_NAME,
        url: personId,
        sameAs: [personId],
      },
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        url,
        name: params.title,
        description: params.description,
        about: { "@id": personId },
        primaryImageOfPage: { "@type": "ImageObject", url: `${base}/og-image.webp` },
      },
    ],
  };
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
  const personId = blogAuthorPersonId(base);
  const profileUrl = personId;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": personId,
        name: BLOG_AUTHOR_PERSON_NAME,
        url: profileUrl,
        sameAs: [profileUrl],
      },
      {
        "@type": "Article",
        "@id": `${url}#article`,
        headline: params.title,
        description: params.description,
        url,
        datePublished: params.datePublished,
        dateModified: params.dateModified,
        author: { "@id": personId },
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
