/**
 * Загрузка JSON-LD с бэкенда (GET /api/v1/seo/structured-data/).
 * Должен совпадать SEO_SITE_URL (Django) с NEXT_PUBLIC_SITE_URL (Next).
 */

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

export async function fetchStructuredData(params: {
  bundles: string[];
  locale: string;
  pageUrl?: string;
  slug?: string;
  clientOs?: string;
  title?: string;
  description?: string;
}): Promise<StructuredDataDoc | null> {
  try {
    const u = new URL(`${apiV1Base()}/seo/structured-data/`);
    u.searchParams.set("bundles", params.bundles.join(","));
    u.searchParams.set("locale", params.locale);
    if (params.pageUrl) u.searchParams.set("page_url", params.pageUrl);
    if (params.slug) u.searchParams.set("slug", params.slug);
    if (params.clientOs) u.searchParams.set("client_os", params.clientOs);
    if (params.title) u.searchParams.set("title", params.title);
    if (params.description) u.searchParams.set("description", params.description);
    const res = await fetch(u.toString(), {
      next: { revalidate: 3600 },
      headers: {
        Accept: "application/json",
        "X-Locale": params.locale,
      },
    });
    if (!res.ok) return null;
    return (await res.json()) as StructuredDataDoc;
  } catch {
    return null;
  }
}
