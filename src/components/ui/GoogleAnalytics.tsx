"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import {
  COOKIE_CONSENT_CHANGE_EVENT,
  readCookieConsent,
  type CookieConsentState,
} from "@/lib/cookieConsent";

/** ID по умолчанию; переопределяется NEXT_PUBLIC_GA_MEASUREMENT_ID */
const DEFAULT_MEASUREMENT_ID = "G-C64QP6ZDE3";

const GA_MEASUREMENT_ID_RE = /^G-[A-Z0-9]+$/i;

function measurementId(): string | undefined {
  const fromEnv = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
  const raw = fromEnv && fromEnv.length > 0 ? fromEnv : DEFAULT_MEASUREMENT_ID;
  if (!GA_MEASUREMENT_ID_RE.test(raw)) return undefined;
  return raw;
}

/**
 * Загрузка gtag.js только при согласии на аналитику (cookieConsent.analytics).
 */
export default function GoogleAnalytics() {
  const id = measurementId();
  const [analyticsAllowed, setAnalyticsAllowed] = useState(false);

  useEffect(() => {
    const sync = () => {
      const consent = readCookieConsent();
      setAnalyticsAllowed(consent?.analytics === true);
    };
    sync();

    const onConsentChange = (e: Event) => {
      const ce = e as CustomEvent<CookieConsentState>;
      setAnalyticsAllowed(ce.detail.analytics);
    };
    window.addEventListener(COOKIE_CONSENT_CHANGE_EVENT, onConsentChange);
    return () => window.removeEventListener(COOKIE_CONSENT_CHANGE_EVENT, onConsentChange);
  }, []);

  if (!id || !analyticsAllowed) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="afterInteractive" />
      <Script id="google-analytics-gtag" strategy="afterInteractive">
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
