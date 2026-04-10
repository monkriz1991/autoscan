import { getSiteOrigin } from "@/lib/site-url";

/** Публичные реквизиты для юридических страниц (Privacy и т.п.). */
export type LegalSiteInfo = {
  siteOrigin: string;
  /** Хост сайта (включая нестандартный порт), для отображения как «домен» в политике. */
  siteDomain: string;
  legalEntityName: string;
  legalEntityReg: string;
  legalEntityAddress: string;
  privacyEmail: string;
};

/**
 * Читает NEXT_PUBLIC_SITE_URL и опциональные реквизиты оператора.
 * Для продакшена задайте NEXT_PUBLIC_LEGAL_ENTITY_* и почту в .env фронтенда.
 */
export function getLegalSiteInfo(): LegalSiteInfo {
  const siteOrigin = getSiteOrigin();
  let siteDomain = "localhost";
  try {
    siteDomain = new URL(siteOrigin).host;
  } catch {
    siteDomain = "localhost";
  }

  const legalEntityName =
    process.env.NEXT_PUBLIC_LEGAL_ENTITY_NAME?.trim() || "AutoScan";
  const legalEntityReg = process.env.NEXT_PUBLIC_LEGAL_ENTITY_REG?.trim() || "";
  const legalEntityAddress =
    process.env.NEXT_PUBLIC_LEGAL_ENTITY_ADDRESS?.trim() || "";
  const privacyEmail =
    process.env.NEXT_PUBLIC_PRIVACY_EMAIL?.trim() ||
    process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() ||
    "";

  return {
    siteOrigin,
    siteDomain,
    legalEntityName,
    legalEntityReg,
    legalEntityAddress,
    privacyEmail,
  };
}
