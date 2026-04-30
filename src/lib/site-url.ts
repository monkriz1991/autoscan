import { routing } from "@/i18n/routing";

/** Базовый origin сайта для canonical, Open Graph и sitemap (NEXT_PUBLIC_SITE_URL). */
export function getSiteOrigin(): string {
  const raw = (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    process.env.FRONTEND_BASE_URL ||
    "https://aiscanauto.com"
  ).trim();
  return raw.replace(/\/$/, "");
}

export function getMetadataBase(): URL {
  return new URL(`${getSiteOrigin()}/`);
}

/**
 * Удаляет трекинговые query-параметры (UTM, ref, клики рекламы) — canonical без дублей.
 */
export function stripTrackingSearchParams(searchParams: URLSearchParams): URLSearchParams {
  const out = new URLSearchParams();
  for (const [key, value] of searchParams) {
    const k = key.toLowerCase();
    if (k === "ref" || k === "gclid" || k === "fbclid" || k === "msclkid" || k === "mc_eid" || k.startsWith("utm_")) {
      continue;
    }
    out.append(key, value);
  }
  return out;
}

/**
 * Нормализованный путь без префикса локали: "" для главной, иначе "/faq", "/blog/slug".
 */
export function pathWithoutLocaleSegment(pathWithoutLocale: string): string {
  if (pathWithoutLocale === "" || pathWithoutLocale === "/") {
    return "";
  }
  return pathWithoutLocale.startsWith("/") ? pathWithoutLocale : `/${pathWithoutLocale}`;
}

/**
 * Путь с префиксом локали для редиректов (localePrefix: as-needed — defaultLocale без префикса).
 */
export function localizedPath(locale: string, pathWithoutLocale: string): string {
  const path = pathWithoutLocaleSegment(pathWithoutLocale);
  if (locale === routing.defaultLocale) {
    return path === "" ? "/" : path;
  }
  return path === "" ? `/${locale}` : `/${locale}${path}`;
}

/**
 * Разбор pathname (без query): префикс локали из routing.locales или defaultLocale + путь без локали.
 */
export function splitLocaleFromPathname(pathname: string): { locale: string; pathWithoutLocale: string } {
  const trimmed = pathname.replace(/\/+$/, "") || "/";
  if (trimmed === "/") {
    return { locale: routing.defaultLocale, pathWithoutLocale: "" };
  }
  const segments = trimmed.split("/").filter(Boolean);
  const first = segments[0];
  if ((routing.locales as readonly string[]).includes(first)) {
    const rest = segments.slice(1).join("/");
    return { locale: first, pathWithoutLocale: rest ? `/${rest}` : "" };
  }
  return { locale: routing.defaultLocale, pathWithoutLocale: trimmed.startsWith("/") ? trimmed : `/${trimmed}` };
}

/**
 * Нормализация регистра OBD2 DTC в пути для canonical и hreflang (/dtc/p0420 → /dtc/P0420).
 */
export function normalizePathForSeo(pathWithoutLocale: string): string {
  const path = pathWithoutLocaleSegment(pathWithoutLocale);
  if (!path) return "";
  const m = path.match(/^(\/dtc\/)([PpBbCcUu][0-9A-Fa-f]{4})$/);
  if (m) return `${m[1]}${m[2].toUpperCase()}`;
  return path;
}

/**
 * Абсолютный canonical URL для текущего сайта.
 *
 * @param path — путь от корня с опциональным query (`/ru/blog?page=2&utm_source=x`) или полный URL того же origin.
 *        UTM/ref и аналоги удаляются; «полезные» параметры (например page) сохраняются.
 *        Trailing slash убирается (кроме корня: `https://aiscanauto.com/`).
 */
export function generateCanonicalUrl(path: string): string {
  const origin = getSiteOrigin();
  const trimmed = path.trim();

  let pathname: string;
  let searchParams: URLSearchParams;

  if (/^https?:\/\//i.test(trimmed)) {
    const u = new URL(trimmed);
    pathname = u.pathname || "/";
    searchParams = stripTrackingSearchParams(u.searchParams);
  } else {
    const rel = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
    const q = rel.indexOf("?");
    const pathPart = (q >= 0 ? rel.slice(0, q) : rel).replace(/\/+$/, "") || "/";
    const queryPart = q >= 0 ? rel.slice(q + 1) : "";
    pathname = pathPart;
    searchParams = stripTrackingSearchParams(new URLSearchParams(queryPart));
  }

  pathname = pathname.replace(/\/+$/, "") || "/";
  const { locale, pathWithoutLocale } = splitLocaleFromPathname(pathname);
  const normalizedInner = normalizePathForSeo(pathWithoutLocale);
  let localized = localizedPath(locale, normalizedInner);
  if (localized.length > 1 && localized.endsWith("/")) {
    localized = localized.slice(0, -1);
  }

  const search = searchParams.toString();
  const querySuffix = search ? `?${search}` : "";

  if (localized === "/" || localized === "") {
    return search ? `${origin}/?${search}` : `${origin}/`;
  }

  return `${origin}${localized}${querySuffix}`;
}

/** Canonical по локали и пути без префикса локали (удобно из generateMetadata). */
export function generateCanonicalUrlForLocale(locale: string, pathWithoutLocale: string): string {
  return generateCanonicalUrl(localizedPath(locale, pathWithoutLocale));
}

/** Одна запись hreflang для `<link rel="alternate">` / `alternates.languages` в Next Metadata. */
export type AlternateLanguageLink = { href: string; hreflang: string };

function pathnameForAlternateInput(currentPath: string): string {
  const t = currentPath.trim();
  if (/^https?:\/\//i.test(t)) {
    const p = new URL(t).pathname.replace(/\/+$/, "");
    return p === "" ? "/" : p;
  }
  const p = (t.startsWith("/") ? t : `/${t}`).replace(/\/+$/, "");
  return p === "" ? "/" : p;
}

/**
 * hreflang для всех локалей + `x-default` (канон англ. as-needed без `/en`).
 *
 * @param currentPath — путь без локали (`/dtc/P0420`), с префиксом (`/ru/dtc/P0420`),
 *   относительный от корня или абсолютный URL того же сайта; сегмент локали при наличии отбрасывается.
 */
export function getAlternateLanguages(currentPath: string): AlternateLanguageLink[] {
  const pathname = pathnameForAlternateInput(currentPath);
  const { pathWithoutLocale } = splitLocaleFromPathname(pathname);
  const inner = normalizePathForSeo(pathWithoutLocaleSegment(pathWithoutLocale));
  const origin = getSiteOrigin();
  const out: AlternateLanguageLink[] = [];
  for (const loc of routing.locales) {
    const href =
      loc === routing.defaultLocale
        ? inner === ""
          ? `${origin}/`
          : `${origin}${inner}`
        : inner === ""
          ? `${origin}/${loc}`
          : `${origin}/${loc}${inner}`;
    out.push({ href, hreflang: loc });
  }
  out.push({
    href: inner === "" ? `${origin}/` : `${origin}${inner}`,
    hreflang: "x-default",
  });
  return out;
}

/**
 * Путь без префикса локали, с ведущим слэшем или пустая строка для главной.
 * Пример: "", "/pricing", "/faq", "/blog/post-slug"
 * Включает ключ x-default (URL defaultLocale) для hreflang.
 */
/**
 * Карта hreflang → абсолютный URL.
 * @param querySuffix — только «безопасные» параметры (например `?page=2` для списков DTC/блога),
 *   чтобы взаимные alternate совпадали с каноном пагинации.
 */
export function alternateLanguageUrls(
  pathWithoutLocale: string,
  querySuffix: string = "",
): Record<string, string> {
  const inner = normalizePathForSeo(pathWithoutLocaleSegment(pathWithoutLocale));
  const pathForGetter = inner === "" ? "/" : inner;
  const links = getAlternateLanguages(pathForGetter);
  const q =
    querySuffix === "" ? "" : querySuffix.startsWith("?") ? querySuffix : `?${querySuffix}`;
  const out: Record<string, string> = {};
  for (const { href, hreflang } of links) {
    out[hreflang] = `${href}${q}`;
  }
  return out;
}

/** Локаль для og:locale */
export function localeToOpenGraphLocale(locale: string): string {
  const map: Record<string, string> = {
    en: "en_US",
    de: "de_DE",
    ru: "ru_RU",
    pl: "pl_PL",
    it: "it_IT",
    es: "es_ES",
  };
  return map[locale] ?? "en_US";
}
