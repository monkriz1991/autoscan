import createMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const DEFAULT_AFTER_AUTH = "/superadmin/dashboard";

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  const localeMatch = pathname.match(/^\/(en|de|ru|pl|it|es)(\/|$)/);
  const pathWithoutLocale = localeMatch
    ? pathname.slice(localeMatch[1].length + 1) || "/"
    : pathname;

  if (token && (pathWithoutLocale === "/login" || pathWithoutLocale === "/register" || pathWithoutLocale.startsWith("/login/") || pathWithoutLocale.startsWith("/register/"))) {
    const locale = localeMatch?.[1] || "en";
    const next = request.nextUrl.searchParams.get("next") || `/${locale}${DEFAULT_AFTER_AUTH}`;
    return NextResponse.redirect(new URL(next, request.url));
  }
  if (
    !token &&
    (pathWithoutLocale.startsWith("/business") ||
      pathWithoutLocale.startsWith("/superadmin") ||
      pathWithoutLocale.startsWith("/auth/authorize"))
  ) {
    const locale = localeMatch?.[1] || "en";
    const loginUrl = new URL(`/${locale}/login`, request.url);
    const fullPath = pathname + (request.nextUrl.search || "");
    loginUrl.searchParams.set("next", fullPath);
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
