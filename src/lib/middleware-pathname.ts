/** Имя заголовка запроса: путь без префикса локали (выставляет middleware, читает [locale]/layout). */
export const MIDDLEWARE_PATHNAME_HEADER = "x-pathname";

/** Главная [locale]/page.tsx — нормализованный путь равен "/". */
export function isHomeNormalizedPath(pathWithoutLocale: string): boolean {
  const n = pathWithoutLocale.replace(/\/+$/, "") || "/";
  return n === "/";
}

/** Публичные страницы с тем же визуальным chrome, что и лендинг (градиент, шапка/футер как на главной). */
const LANDING_CHROME_EXACT = new Set([
  "/blog",
  "/download",
  "/faq",
  "/pricing",
  "/login",
  "/register",
]);

export function isLandingChromePath(pathWithoutLocale: string): boolean {
  const n = pathWithoutLocale.replace(/\/+$/, "") || "/";
  if (LANDING_CHROME_EXACT.has(n)) return true;
  if (n.startsWith("/blog/")) return true;
  if (n.startsWith("/auth/")) return true;
  return false;
}

export type LayoutChromeKind = "home" | "landing" | "default";

export function getLayoutChromeKind(pathWithoutLocale: string): LayoutChromeKind {
  if (isHomeNormalizedPath(pathWithoutLocale)) return "home";
  if (isLandingChromePath(pathWithoutLocale)) return "landing";
  return "default";
}
