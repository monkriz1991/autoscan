"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { Container } from "@mantine/core";

/**
 * Шлюз для OAuth: Django редиректит сюда с ?next=/o/authorize/?params.
 * Парсим next, извлекаем OAuth-параметры и редиректим на /auth/authorize.
 * Если не залогинен — редирект на /login?next=текущая_страница.
 */
function OAuthEntryRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const nextEncoded = searchParams.get("next");
    if (!nextEncoded) {
      router.replace("/");
      return;
    }
    try {
      const nextPath = decodeURIComponent(nextEncoded);
      // nextPath = "/o/authorize/?response_type=code&client_id=...&redirect_uri=..."
      const [path, query = ""] = nextPath.includes("?") ? nextPath.split("?", 2) : [nextPath, ""];
      if (!path.includes("/o/authorize")) {
        router.replace("/");
        return;
      }
      // Редирект на страницу согласия с теми же OAuth-параметрами
      router.replace(`/auth/authorize?${query}`);
    } catch {
      router.replace("/");
    }
  }, [searchParams, router]);

  return (
    <Container size="xs" py="xl">
      <div style={{ textAlign: "center", padding: "2rem" }}>
        Перенаправление…
      </div>
    </Container>
  );
}

export default function OAuthEntryPage() {
  return (
    <Suspense fallback={<Container size="xs" py="xl"><div style={{ textAlign: "center" }}>Загрузка…</div></Container>}>
      <OAuthEntryRedirect />
    </Suspense>
  );
}
