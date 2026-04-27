/**
 * Статический JSON-LD при недоступности API /seo/structured-data/ (fallback для SSR).
 * Формат @id совпадает с Django (apps.seo.builders.organization / website).
 */

import { routing } from "@/i18n/routing";
import { getSiteOrigin } from "@/lib/site-url";
import type { StructuredDataDoc } from "@/lib/seo/structured-data";

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
