import createNextIntlPlugin from "next-intl/plugin";

/**
 * Международная маршрутизация (App Router): ключ `i18n` в next.config не используется —
 * он относится к старому Pages Router. Здесь локали задаются в `src/i18n/routing.ts`,
 * префиксы URL и локаль обрабатывает `src/middleware.ts` (next-intl + кастомная логика; `localeCookie: false` в routing).
 * Домен по умолчанию для canonical/OG: NEXT_PUBLIC_SITE_URL → https://aiscanauto.com
 */
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// Backend base URL for rewrites (without /api/v1). Default for dev: 8001
const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8001/api/v1";
const backendBase = process.env.NEXT_PUBLIC_BACKEND_BASE ||
  apiBase.replace(/\/api\/v1\/?$/, "").replace(/\/$/, "") ||
  "http://localhost:8001";

const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  /** Не отдаём заголовок X-Powered-By: Next.js */
  poweredByHeader: false,
  /** ESM-пакет Swiper: явная трансформация снижает сбои бандлера (webpack / Turbopack). */
  transpilePackages: ["swiper"],
  // CDN (s-maxage): публичные HTML/страницы; «последнее совпадение» переопределяет Cache-Control для того же ключа.
  // Динамика под авторизацией — отдельные правила ниже (private, no-cache).
  async headers() {
    const privateAuthPages = [
      { key: "Cache-Control", value: "private, no-cache, must-revalidate" },
    ];
    const securityHeaders = [
      {
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=()",
      },
    ];
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        source: "/_next/static/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/((?!api/|_next/|favicon\\.ico|.*\\..*).*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=300, stale-while-revalidate=60",
          },
        ],
      },
      { source: "/cabinet/:path*", headers: privateAuthPages },
      { source: "/account/:path*", headers: privateAuthPages },
      { source: "/(ru|de|pl|es|it)/cabinet/:path*", headers: privateAuthPages },
      { source: "/(ru|de|pl|es|it)/account/:path*", headers: privateAuthPages },
    ];
  },
  // SEO: канонический URL — /pricing; легаси /marketing/pricing редиректится в приложении и здесь для запросов без локали-префикса и т.д.
  async redirects() {
    return [
      { source: "/marketing/pricing", destination: "/pricing", permanent: true },
      { source: "/en/marketing/pricing", destination: "/pricing", permanent: true },
      {
        source: "/:locale(ru|de|pl|es|it)/marketing/pricing",
        destination: "/:locale/pricing",
        permanent: true,
      },
      // Легаси slug с верхним регистром (middleware тоже нормализует /blog/*)
      {
        source: "/blog/OBD2-PID-Reference",
        destination: "/blog/obd2-pid-reference",
        permanent: true,
      },
      {
        source: "/en/blog/OBD2-PID-Reference",
        destination: "/blog/obd2-pid-reference",
        permanent: true,
      },
      {
        source: "/:locale(ru|de|pl|es|it)/blog/OBD2-PID-Reference",
        destination: "/:locale/blog/obd2-pid-reference",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      { source: "/api-auth/:path*", destination: `${backendBase}/api-auth/:path*` },
      { source: "/o/:path*", destination: `${backendBase}/o/:path*` },
    ];
  },
};

export default withNextIntl(nextConfig);
