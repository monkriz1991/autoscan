import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  if (token && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(
      new URL("/business/admin/services", request.url),
    );
  }
  if (
    !token &&
    (pathname.startsWith("/business") || pathname.startsWith("/superadmin"))
  ) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/business/:path*", "/superadmin/:path*", "/login", "/register"],
};
