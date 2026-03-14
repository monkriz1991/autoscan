import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const DEFAULT_AFTER_AUTH = "/superadmin/dashboard";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  if (token && (pathname === "/login" || pathname === "/register")) {
    const next = request.nextUrl.searchParams.get("next") || DEFAULT_AFTER_AUTH;
    return NextResponse.redirect(new URL(next, request.url));
  }
  if (
    !token &&
    (pathname.startsWith("/business") || pathname.startsWith("/superadmin"))
  ) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/business/:path*", "/superadmin/:path*", "/login", "/register"],
};
