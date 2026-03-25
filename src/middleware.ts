import createMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const DEFAULT_AFTER_AUTH = "/cabinet/dashboard";

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  const localeMatch = pathname.match(/^\/(en|de|ru|pl|it|es)(\/|$)/);
  const pathWithoutLocale = localeMatch
    ? pathname.slice(localeMatch[1].length + 1) || "/"
    : pathname;

  // Редирект со старого префикса /superadmin на /cabinet
  if (pathWithoutLocale === "/superadmin" || pathWithoutLocale.startsWith("/superadmin/")) {
    const locale = localeMatch?.[1] || routing.defaultLocale;
    const suffix =
      pathWithoutLocale === "/superadmin"
        ? "/dashboard"
        : pathWithoutLocale.slice("/superadmin".length);
    const targetPath = `/${locale}/cabinet${suffix}`;
    return NextResponse.redirect(new URL(targetPath, request.url), 308);
  }

  if (token && (pathWithoutLocale === "/login" || pathWithoutLocale === "/register" || pathWithoutLocale.startsWith("/login/") || pathWithoutLocale.startsWith("/register/"))) {
    const locale = localeMatch?.[1] || routing.defaultLocale;
    const next = request.nextUrl.searchParams.get("next") || `/${locale}${DEFAULT_AFTER_AUTH}`;
    return NextResponse.redirect(new URL(next, request.url));
  }
  if (
    !token &&
    (pathWithoutLocale.startsWith("/business") || pathWithoutLocale.startsWith("/cabinet"))
  ) {
    const locale = localeMatch?.[1] || routing.defaultLocale;
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: [
    "/(en|de|ru|pl|it|es)/:path*",
    "/((?!api|_next|_vercel|.*\\..*).*)",
  ],
};
