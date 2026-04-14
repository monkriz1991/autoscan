import createNextIntlPlugin from "next-intl/plugin";

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
  // Снижает риск «старый HTML + новые/удалённые чанки» после деплоя (webpack .call на undefined).
  // Для `/_next/static/*` ниже задаётся immutable — он перекрывает общее правило (в Next побеждает последнее совпадение).
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [{ key: "Cache-Control", value: "private, no-cache, must-revalidate" }],
      },
      {
        source: "/_next/static/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
  // OAuth: redirect_uri без префикса локали — при as-needed страница доступна как /auth/callback
  async redirects() {
    return [];
  },
  async rewrites() {
    return [
      { source: "/api-auth/:path*", destination: `${backendBase}/api-auth/:path*` },
      { source: "/o/:path*", destination: `${backendBase}/o/:path*` },
    ];
  },
};

export default withNextIntl(nextConfig);
