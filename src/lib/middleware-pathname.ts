/** Имя заголовка запроса: путь без префикса локали (выставляет middleware, читает [locale]/layout). */
export const MIDDLEWARE_PATHNAME_HEADER = "x-pathname";

/**
 * Полный pathname запроса (напр. `/de/faq`, `/`) — для `<html lang>` в root layout.
 * В `headers()` иногда видно как `x-url-pathname`, иногда как `x-middleware-request-x-url-pathname`.
 * Читать после `await connection()` в `app/layout.tsx`, иначе при пререндере нет данных middleware.
 */
export const MIDDLEWARE_REQUEST_PATHNAME_HEADER = "x-url-pathname";

/** Query без UTM/ref — для canonical в layout (сохраняет page и др.). */
export const MIDDLEWARE_CANONICAL_SEARCH_HEADER = "x-canonical-search";

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
  "/dtc",
]);

export function isLandingChromePath(pathWithoutLocale: string): boolean {
  const n = pathWithoutLocale.replace(/\/+$/, "") || "/";
  if (LANDING_CHROME_EXACT.has(n)) return true;
  if (n.startsWith("/blog/")) return true;
  if (n.startsWith("/dtc/")) return true;
  if (n.startsWith("/auth/")) return true;
  return false;
}

export type LayoutChromeKind = "home" | "landing" | "default";

export function getLayoutChromeKind(pathWithoutLocale: string): LayoutChromeKind {
  if (isHomeNormalizedPath(pathWithoutLocale)) return "home";
  if (isLandingChromePath(pathWithoutLocale)) return "landing";
  return "default";
}

/**
 * Страницы, где полный JSON-LD (global + page) отдаётся в одном `<script>` на уровне page — дубль global в layout не нужен.
 * Если заголовок отсутствует (без middleware), оставляем global в layout.
 */
export function shouldOmitLayoutGlobalJsonLd(pathHeader: string | null | undefined): boolean {
  if (pathHeader == null || pathHeader === "") return false;
  const n = pathHeader.replace(/\/+$/, "") || "/";
  return n === "/faq" || n === "/pricing";
}
