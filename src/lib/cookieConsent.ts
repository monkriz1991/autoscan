/** Настройки согласия на cookie (localStorage) для GDPR/ePrivacy и учёта opt-out CCPA/CPRA */

export const COOKIE_CONSENT_STORAGE_KEY = "autoscan_cookie_consent_v1";
export const CONSENT_VERSION = 1;

export type CookieConsentState = {
  version: number;
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  /** Opt-out продажи/шеринга ПДн в понимании законов США (в т.ч. Калифорния) */
  saleShareOptOut: boolean;
  savedAt: string;
};

export const COOKIE_CONSENT_CHANGE_EVENT = "autoscan:cookie-consent";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function parseStoredConsent(raw: string | null): CookieConsentState | null {
  if (!raw) return null;
  try {
    const data: unknown = JSON.parse(raw);
    if (!isRecord(data)) return null;
    if (data.version !== CONSENT_VERSION) return null;
    if (data.necessary !== true) return null;
    if (typeof data.analytics !== "boolean") return null;
    if (typeof data.marketing !== "boolean") return null;
    if (typeof data.saleShareOptOut !== "boolean") return null;
    if (typeof data.savedAt !== "string") return null;
    return {
      version: CONSENT_VERSION,
      necessary: true,
      analytics: data.analytics,
      marketing: data.marketing,
      saleShareOptOut: data.saleShareOptOut,
      savedAt: data.savedAt,
    };
  } catch {
    return null;
  }
}

export function readCookieConsent(): CookieConsentState | null {
  if (typeof window === "undefined") return null;
  return parseStoredConsent(window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY));
}

export function writeCookieConsent(state: CookieConsentState): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent<CookieConsentState>(COOKIE_CONSENT_CHANGE_EVENT, { detail: state }));
}

export function buildConsent(partial: Omit<CookieConsentState, "version" | "necessary" | "savedAt">): CookieConsentState {
  return {
    version: CONSENT_VERSION,
    necessary: true,
    analytics: partial.analytics,
    marketing: partial.marketing,
    saleShareOptOut: partial.saleShareOptOut,
    savedAt: new Date().toISOString(),
  };
}

/** Только необходимые cookie + opt-out продажи/шеринга (консервативный пресет для ЕС/США) */
export function presetRejectOptional(): CookieConsentState {
  return buildConsent({
    analytics: false,
    marketing: false,
    saleShareOptOut: true,
  });
}

export function presetAcceptAll(): CookieConsentState {
  return buildConsent({
    analytics: true,
    marketing: true,
    saleShareOptOut: false,
  });
}
