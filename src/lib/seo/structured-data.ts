/**
 * Загрузка JSON-LD с бэкенда (GET /api/v1/seo/structured-data/).
 * Должен совпадать SEO_SITE_URL (Django) с NEXT_PUBLIC_SITE_URL (Next).
 */

import { logSsrFetchMs } from "@/lib/server-fetch-timing";

export type StructuredDataDoc = {
  "@context": string;
  "@graph": Record<string, unknown>[];
};

function apiV1Base(): string {
  return (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8001/api/v1").replace(/\/$/, "");
}

/** Безопасная сериализация для вставки в <script type="application/ld+json">. */
export function safeStringifyStructuredData(data: StructuredDataDoc): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/** Реже кэш, чем 3600: при пустом ответе раньше восстанавливаем данные с API; критичные схемы дублирует static fallback. */
const STRUCTURED_DATA_REVALIDATE_SEC = 600;

function logStructuredDataFailure(url: string, detail: string, err?: unknown) {
  const msg = `[fetchStructuredData] ${detail} ${url}`;
  if (process.env.NODE_ENV === "development") {
    console.warn(msg, err ?? "");
    return;
  }
  // Прод: одна строка для агрегации логов (Datadog, CloudWatch и т.д.)
  console.error(msg, err instanceof Error ? err.message : err ?? "");
}

export async function fetchStructuredData(params: {
  bundles: string[];
  locale: string;
  pageUrl?: string;
  slug?: string;
  clientOs?: string;
  title?: string;
  description?: string;
}): Promise<StructuredDataDoc | null> {
  const u = new URL(`${apiV1Base()}/seo/structured-data/`);
  u.searchParams.set("bundles", params.bundles.join(","));
  u.searchParams.set("locale", params.locale);
  if (params.pageUrl) u.searchParams.set("page_url", params.pageUrl);
  if (params.slug) u.searchParams.set("slug", params.slug);
  if (params.clientOs) u.searchParams.set("client_os", params.clientOs);
  if (params.title) u.searchParams.set("title", params.title);
  if (params.description) u.searchParams.set("description", params.description);
  const urlStr = u.toString();

  try {
    const res = await logSsrFetchMs(`seo/structured-data bundles=${params.bundles.join(",")}`, async () =>
      fetch(urlStr, {
        next: { revalidate: STRUCTURED_DATA_REVALIDATE_SEC },
        headers: {
          Accept: "application/json",
          "X-Locale": params.locale,
        },
      }),
    );
    if (!res.ok) {
      logStructuredDataFailure(urlStr, `HTTP ${res.status}`);
      return null;
    }
    const data = (await res.json()) as StructuredDataDoc;
    if (!data || !Array.isArray(data["@graph"]) || data["@graph"].length === 0) {
      logStructuredDataFailure(urlStr, "empty @graph");
      return null;
    }
    return data;
  } catch (err) {
    logStructuredDataFailure(urlStr, "request failed", err);
    return null;
  }
}

/** Если ответ API пустой — подставляем заранее собранный документ (статический JSON-LD). */
export function withStructuredDataFallback(
  remote: StructuredDataDoc | null,
  fallback: StructuredDataDoc,
): StructuredDataDoc {
  if (remote && Array.isArray(remote["@graph"]) && remote["@graph"].length > 0) {
    return remote;
  }
  return fallback;
}
