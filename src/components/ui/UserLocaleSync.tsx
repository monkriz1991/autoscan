"use client";

import { useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { getMe, updateMe } from "@/lib/api";
import { routing } from "@/i18n/routing";

/**
 * Синхронизирует interface_locale на backend с сегментом [locale] в URL кабинета,
 * чтобы письма приходили на языке интерфейса.
 */
export default function UserLocaleSync() {
  const params = useParams();
  const raw = params?.locale;
  const locale =
    typeof raw === "string" && routing.locales.includes(raw as (typeof routing.locales)[number])
      ? raw
      : "";
  const busy = useRef(false);

  useEffect(() => {
    if (!locale) return;

    let cancelled = false;

    const run = async () => {
      if (busy.current) return;
      busy.current = true;
      try {
        const user = await getMe();
        if (cancelled) return;
        if (user.interface_locale === locale) return;
        await updateMe({ interface_locale: locale });
      } catch {
        // нет токена или сеть — тихо пропускаем
      } finally {
        if (!cancelled) busy.current = false;
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [locale]);

  return null;
}
