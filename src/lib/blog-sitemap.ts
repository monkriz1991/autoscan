/**
 * Список slug постов блога для sitemap (сервер, без cookie клиента).
 */

function apiV1Base(): string {
  return (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8001/api/v1").replace(/\/$/, "");
}

export async function fetchBlogSlugsForSitemap(): Promise<string[]> {
  try {
    const res = await fetch(`${apiV1Base()}/blog/`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 120 },
    });
    if (!res.ok) return [];
    const data: unknown = await res.json();
    if (!Array.isArray(data)) return [];
    return data
      .map((row) => (row && typeof row === "object" && "slug" in row ? String((row as { slug: unknown }).slug ?? "") : ""))
      .filter(Boolean);
  } catch {
    return [];
  }
}
