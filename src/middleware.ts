import createMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  MIDDLEWARE_CANONICAL_SEARCH_HEADER,
  MIDDLEWARE_PATHNAME_HEADER,
  MIDDLEWARE_REQUEST_PATHNAME_HEADER,
} from "@/lib/middleware-pathname";
import { normalizePathSegmentsCase } from "@/lib/normalize-path-case";
import { getSiteOrigin, localizedPath, stripTrackingSearchParams } from "@/lib/site-url";
import { routing } from "./i18n/routing";

const DEFAULT_AFTER_AUTH = "/cabinet/dashboard";

const intlMiddleware = createMiddleware(routing);

const localePathRe = new RegExp(`^\\/(${routing.locales.join("|")})(\\/|$)`);

export default function middleware(request: NextRequest) {
  /** Канонический хост без www (как в NEXT_PUBLIC_SITE_URL) — редирект, если запрос пришёл на www. */
  const hostRaw = request.headers.get("host");
  const host = hostRaw?.split(":")[0]?.toLowerCase();
  if (host && host !== "localhost" && !host.startsWith("127.0.0.1")) {
    try {
      const apex = new URL(getSiteOrigin()).hostname.toLowerCase();
      if (
        apex &&
        apex !== "localhost" &&
        !apex.startsWith("127.0.0.1") &&
        host === `www.${apex}`
      ) {
        const dest = new URL(request.url);
        dest.hostname = apex;
        return NextResponse.redirect(dest, 301);
      }
    } catch {
      /* ignore: некорректный SITE_URL в dev */
    }
  }

  const { pathname } = request.nextUrl;
  const localeMatch = pathname.match(localePathRe);
  /** Путь без префикса локали: "" = главная этой локали (не смешивать с "/"). */
  const pathWithoutLocale = localeMatch
    ? (() => {
        const rest = pathname.slice(localeMatch[0].length);
        if (rest === "" || rest === "/") return "";
        return rest.startsWith("/") ? rest : `/${rest}`;
      })()
    : pathname === "/" || pathname === ""
      ? ""
      : pathname;
  const normalizedPathForHeader =
    pathWithoutLocale === "" ? "/" : pathWithoutLocale.replace(/\/+$/, "") || "/";

  /** /DTC/P0420 и т.п. → /dtc/P0420 одним редиректом (кроме регистра кода DTC). */
  const pathForCase =
    pathWithoutLocale === "" ? "/" : pathWithoutLocale.startsWith("/") ? pathWithoutLocale : `/${pathWithoutLocale}`;
  const caseNormalized = normalizePathSegmentsCase(pathForCase);
  if (caseNormalized != null) {
    const locale = localeMatch?.[1] || routing.defaultLocale;
    const destUrl = new URL(localizedPath(locale, caseNormalized), request.url);
    destUrl.search = stripTrackingSearchParams(request.nextUrl.searchParams).toString();
    return NextResponse.redirect(destUrl, 301);
  }

  /**
   * Явный префикс defaultLocale в URL (напр. /en) дублирует as-needed каноник (/).
   * 301 на путь без префикса /en — одна версия для индекса (англ. = без префикса).
   * SEO: одна каноническая английская версия + hreflang `en` и `x-default` на тот же URL.
   */
  if (
    localeMatch?.[1] === routing.defaultLocale &&
    (pathname === `/${routing.defaultLocale}` || pathname.startsWith(`/${routing.defaultLocale}/`))
  ) {
    const prefix = `/${routing.defaultLocale}`;
    const rest = pathname === prefix ? "/" : pathname.slice(prefix.length) || "/";
    const destUrl = new URL(rest.startsWith("/") ? rest : `/${rest}`, request.url);
    destUrl.search = stripTrackingSearchParams(request.nextUrl.searchParams).toString();
    return NextResponse.redirect(destUrl, 301);
  }

  // OBD2 DTC: канонический регистр кода (301: /dtc/p0420 → /dtc/P0420)
  const dtcMatch = pathWithoutLocale.match(/^\/dtc\/([PpBbCcUu][0-9A-Fa-f]{4})\/?$/);
  if (dtcMatch) {
    const codeRaw = dtcMatch[1];
    const codeUpper = codeRaw.toUpperCase();
    if (codeRaw !== codeUpper) {
      const locale = localeMatch?.[1] || routing.defaultLocale;
      return NextResponse.redirect(
        new URL(localizedPath(locale, `/dtc/${codeUpper}`), request.url),
        301,
      );
    }
  }

  // Блог: slug только в lowercase (301: /blog/OBD2-PID-Reference → /blog/obd2-pid-reference)
  const blogSlugMatch = pathWithoutLocale.match(/^\/blog\/([^/]+)\/?$/);
  if (blogSlugMatch) {
    const slugSeg = blogSlugMatch[1];
    const slugLower = slugSeg.toLowerCase();
    /** Канонический slug после lower-case; отдельные SEO-редиректы (опечатки в URL). */
    const canonicalBlogSlug = slugLower === "choice-of-obd-scaner" ? "choice-of-obd-scanner" : slugLower;
    if (slugSeg !== canonicalBlogSlug) {
      const locale = localeMatch?.[1] || routing.defaultLocale;
      const destUrl = new URL(localizedPath(locale, `/blog/${canonicalBlogSlug}`), request.url);
      destUrl.search = stripTrackingSearchParams(request.nextUrl.searchParams).toString();
      return NextResponse.redirect(destUrl, 301);
    }
  }

  // Сначала next-intl: префикс в URL (localeCookie: false — без Set-Cookie для CDN-кэша HTML)
  const intlResponse = intlMiddleware(request);
  if (intlResponse.status >= 300 && intlResponse.status < 400) {
    return intlResponse;
  }

  const token = request.cookies.get("token")?.value;

  // Редирект со старого префикса /superadmin на /cabinet
  if (pathWithoutLocale === "/superadmin" || pathWithoutLocale.startsWith("/superadmin/")) {
    const locale = localeMatch?.[1] || routing.defaultLocale;
    const suffix =
      pathWithoutLocale === "/superadmin"
        ? "/dashboard"
        : pathWithoutLocale.slice("/superadmin".length);
    const targetPath = localizedPath(locale, `/cabinet${suffix}`);
    return NextResponse.redirect(new URL(targetPath, request.url), 308);
  }

  if (token && (pathWithoutLocale === "/login" || pathWithoutLocale === "/register" || pathWithoutLocale.startsWith("/login/") || pathWithoutLocale.startsWith("/register/"))) {
    const locale = localeMatch?.[1] || routing.defaultLocale;
    const next = request.nextUrl.searchParams.get("next") || localizedPath(locale, DEFAULT_AFTER_AUTH);
    return NextResponse.redirect(new URL(next, request.url));
  }
  if (
    !token &&
    (pathWithoutLocale.startsWith("/business") || pathWithoutLocale.startsWith("/cabinet"))
  ) {
    const locale = localeMatch?.[1] || routing.defaultLocale;
    const loginUrl = new URL(localizedPath(locale, "/login"), request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(MIDDLEWARE_PATHNAME_HEADER, normalizedPathForHeader);
  requestHeaders.set(MIDDLEWARE_REQUEST_PATHNAME_HEADER, pathname);
  requestHeaders.set(
    MIDDLEWARE_CANONICAL_SEARCH_HEADER,
    stripTrackingSearchParams(request.nextUrl.searchParams).toString(),
  );

  const out = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  intlResponse.headers.forEach((value, key) => {
    if (key.toLowerCase() === "set-cookie") {
      return;
    }
    out.headers.set(key, value);
  });
  const setCookies =
    typeof intlResponse.headers.getSetCookie === "function"
      ? intlResponse.headers.getSetCookie()
      : intlResponse.headers.get("set-cookie")
        ? [intlResponse.headers.get("set-cookie")!]
        : [];
  for (const cookie of setCookies) {
    out.headers.append("Set-Cookie", cookie);
  }

  return out;
}

// Список локалей должен совпадать с routing.locales (Next.js требует статический matcher)
export const config = {
  matcher: [
    "/(en|ru|de|pl|es|it)/:path*",
    "/((?!api|_next|_vercel|.*\\..*).*)",
  ],
};
