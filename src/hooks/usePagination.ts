"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useLocalStorage } from "@mantine/hooks";

type Options = {
  defaultPage?: number;
  defaultPageSize?: number;
  storageKey?: string;
};

export function usePagination({
  defaultPage = 1,
  defaultPageSize = 5,
  storageKey = "page-size",
}: Options = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // PAGE — из URL
  const page = Number(searchParams.get("page")) || defaultPage;

  // PAGE SIZE — из localStorage
  const [pageSize, setPageSize] = useLocalStorage({
    key: storageKey,
    defaultValue: defaultPageSize,
  });

  const changePage = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`${pathname}?${params.toString()}`);
  };

  const changePageSize = (newSize: number) => {
    setPageSize(newSize);

    // при смене размера всегда возвращаемся на 1 страницу
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  return {
    page,
    pageSize,
    changePage,
    changePageSize,
  };
}
