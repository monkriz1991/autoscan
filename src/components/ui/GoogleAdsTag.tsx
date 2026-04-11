"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  COOKIE_CONSENT_CHANGE_EVENT,
  readCookieConsent,
  type CookieConsentState,
} from "@/lib/cookieConsent";

/** ID по умолчанию; переопределяется NEXT_PUBLIC_GOOGLE_ADS_ID */
const DEFAULT_ADS_ID = "AW-18065230475";

const GOOGLE_ADS_ID_RE = /^AW-\d+$/i;

function adsConversionId(): string | undefined {
  const fromEnv = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID?.trim();
  const raw = fromEnv && fromEnv.length > 0 ? fromEnv : DEFAULT_ADS_ID;
  if (!GOOGLE_ADS_ID_RE.test(raw)) return undefined;
  return raw;
}

/**
 * Google Ads (gtag.js):
 * — на странице регистрации — всегда (AW-конверсии / ремаркетинг по запросу);
 * — на остальных страницах — только при согласии на маркетинг (cookieConsent.marketing).
 */
export default function GoogleAdsTag() {
  const id = adsConversionId();
  const pathname = usePathname();
  const onRegisterPage = Boolean(pathname?.includes("/register"));
  const [marketingAllowed, setMarketingAllowed] = useState(false);

  useEffect(() => {
    const sync = () => {
      const consent = readCookieConsent();
      setMarketingAllowed(consent?.marketing === true);
    };
    sync();

    const onConsentChange = (e: Event) => {
      const ce = e as CustomEvent<CookieConsentState>;
      setMarketingAllowed(ce.detail.marketing);
    };
    window.addEventListener(COOKIE_CONSENT_CHANGE_EVENT, onConsentChange);
    return () => window.removeEventListener(COOKIE_CONSENT_CHANGE_EVENT, onConsentChange);
  }, []);

  const shouldLoad = onRegisterPage || marketingAllowed;
  if (!id || !shouldLoad) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="afterInteractive" />
      <Script id="google-ads-gtag" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${id}');
        `}
      </Script>
    </>
  );
}
