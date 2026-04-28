import { headers } from "next/headers";
import { setRequestLocale } from "next-intl/server";
import { getDownloadsPageForLocale } from "@/lib/api";
import { detectClientOsFromUserAgent } from "@/lib/detectClientOs";
import DownloadPageClient from "./DownloadPageClient";

type Props = { locale: string };

/** Данные для «Скачать» — отдельный async RSC, чтобы оболочка страницы отдавалась без ожидания downloads/page. */
export default async function DownloadPageInner({ locale }: Props) {
  setRequestLocale(locale);
  const requestHeaders = await headers();
  const clientOs = detectClientOsFromUserAgent(requestHeaders.get("user-agent"));
  const cookieHeader = requestHeaders.get("cookie");

  const initialData = await getDownloadsPageForLocale(clientOs, locale, { cookieHeader }).catch((err) => {
    console.error("[DownloadPageInner] failed to load downloads", err);
    return null;
  });

  return <DownloadPageClient initialData={initialData} loadFailed={!initialData} />;
}
