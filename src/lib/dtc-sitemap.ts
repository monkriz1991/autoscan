/**
 * Sitemap DTC: только для server route (sitemap.ts), не импортировать в клиентский api.ts —
 * иначе в бандл попадёт крупный JSON fallback.
 */
import dtcCodeKeysFallback from "@/data/dtc-code-keys.json";

export type DtcSitemapEntry = { code: string; updated_at?: string; locales?: string[] };

/** Fallback, если API недоступен при сборке (ключи совпадают с импортом DTC на бэкенде). */
function dtcSitemapEntriesFromFallback(): DtcSitemapEntry[] {
  const arr = dtcCodeKeysFallback as unknown;
  if (!Array.isArray(arr)) return [];
  return arr
    .filter((c): c is string => typeof c === "string" && /^[PBCU][0-9A-Fa-f]{4}$/.test(c))
    .map((code) => ({ code: code.toUpperCase() }));
}

/** Список кодов для sitemap (опубликованные из API; при ошибке или пустом ответе — статический fallback). */
export async function getDtcCodesForSitemap(): Promise<DtcSitemapEntry[]> {
  const fallback = dtcSitemapEntriesFromFallback();
  const base = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8001/api/v1").replace(
    /\/$/,
    "",
  );
  try {
    const res = await fetch(`${base}/dtc/sitemap/`, {
      credentials: "omit",
      next: { revalidate: 3600 },
    });
    if (!res.ok) {
      return fallback;
    }
    const data = (await res.json().catch(() => null)) as { codes?: unknown } | null;
    const codes = data?.codes;
    if (!Array.isArray(codes) || codes.length === 0) {
      return fallback;
    }
    const mapped = codes
      .map((row: unknown) => {
        const r = row as Record<string, unknown>;
        const code = String(r.code ?? "").trim().toUpperCase();
        if (!code) return null;
        const ua = r.updated_at;
        const updated_at =
          ua === null || ua === undefined ? "" : typeof ua === "string" ? ua : String(ua);
        const rawLocales = r.locales;
        const locales = Array.isArray(rawLocales)
          ? rawLocales.filter((x): x is string => typeof x === "string" && x.length > 0)
          : undefined;
        return { code, updated_at, locales } as DtcSitemapEntry;
      })
      .filter((x): x is DtcSitemapEntry => x !== null);
    return mapped.length > 0 ? mapped : fallback;
  } catch {
    return fallback;
  }
}
