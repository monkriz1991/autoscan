import createNextIntlPlugin from "next-intl/plugin";

/**
 * Международная маршрутизация (App Router): ключ `i18n` в next.config не используется —
 * он относится к старому Pages Router. Здесь локали задаются в `src/i18n/routing.ts`,
 * префиксы URL и cookie локали обрабатывает `src/middleware.ts` (next-intl + кастомная логика).
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
  /** ESM-пакет Swiper: явная трансформация снижает сбои бандлера (webpack / Turbopack). */
  transpilePackages: ["swiper"],
  // CDN (s-maxage): публичные HTML/страницы; «последнее совпадение» переопределяет Cache-Control для того же ключа.
  // Динамика под авторизацией — отдельные правила ниже (private, no-cache).
  async headers() {
    const privateAuthPages = [
      { key: "Cache-Control", value: "private, no-cache, must-revalidate" },
    ];
    return [
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
