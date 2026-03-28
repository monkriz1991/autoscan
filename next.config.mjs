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
  // OAuth redirect_uri в БД без префикса локали — /auth/callback → страница под [locale]
  async redirects() {
    return [{ source: "/auth/callback", destination: "/en/auth/callback", permanent: false }];
  },
  async rewrites() {
    return [
      { source: "/api-auth/:path*", destination: `${backendBase}/api-auth/:path*` },
      { source: "/o/:path*", destination: `${backendBase}/o/:path*` },
    ];
  },
};

export default withNextIntl(nextConfig);
