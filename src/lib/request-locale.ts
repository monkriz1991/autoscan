import { connection } from "next/server";
import { headers } from "next/headers";
import { MIDDLEWARE_REQUEST_PATHNAME_HEADER } from "@/lib/middleware-pathname";
import { splitLocaleFromPathname } from "@/lib/site-url";

/** Полный pathname из middleware (для `<html lang>` и not-found). */
export async function getRequestPathname(): Promise<string> {
  await connection();
  const h = await headers();
  return (
    h.get(MIDDLEWARE_REQUEST_PATHNAME_HEADER) ??
    h.get(`x-middleware-request-${MIDDLEWARE_REQUEST_PATHNAME_HEADER}`) ??
    "/"
  );
}

/** Локаль из URL запроса (после `connection()`). */
export async function getLocaleFromRequestPathname(): Promise<string> {
  const pathname = await getRequestPathname();
  return splitLocaleFromPathname(pathname).locale;
}
