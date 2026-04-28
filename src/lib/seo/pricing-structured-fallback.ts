/**
 * SSR-fallback для JSON-LD страницы тарифов, если недоступен SEO API (см. apps.seo.builders.pricing).
 */
import type { Plan } from "@/lib/api";
import { buildStaticWebPageStructuredData } from "@/lib/seo/static-structured-data";
import type { StructuredDataDoc } from "@/lib/seo/structured-data";

function softwareAppDisplayName(): string {
  return (
    process.env.NEXT_PUBLIC_SEO_SOFTWARE_APP_NAME ||
    process.env.NEXT_PUBLIC_SITE_NAME ||
    "AIscanAuto"
  ).trim();
}

function softwareAppDescription(): string {
  return (process.env.NEXT_PUBLIC_SEO_SOFTWARE_DESCRIPTION || "").trim();
}

/** WebPage + SoftwareApplication с массивом Offer по планам из публичного API. */
export function buildPricingStructuredDataFromPlans(
  plans: Plan[],
  pageUrl: string,
  title: string,
  description: string,
): StructuredDataDoc {
  const webDoc = buildStaticWebPageStructuredData({ pageUrl, title, description });
  if (plans.length === 0) {
    return webDoc;
  }
  const url = pageUrl.replace(/\/$/, "");
  const appName = softwareAppDisplayName();
  const appDesc = softwareAppDescription();
  const offers = plans.map((plan) => ({
    "@type": "Offer",
    name: plan.name,
    description: plan.name,
    url,
    price: String(plan.price),
    priceCurrency: plan.currency,
    availability: "https://schema.org/InStock",
  }));
  const appNode: Record<string, unknown> = {
    "@type": "SoftwareApplication",
    "@id": `${url}#software-pricing`,
    name: appName,
    url,
    offers,
  };
  if (appDesc) {
    appNode.description = appDesc;
  }
  return {
    "@context": "https://schema.org",
    "@graph": [...webDoc["@graph"], appNode],
  };
}
