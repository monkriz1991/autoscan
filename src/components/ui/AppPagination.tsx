"use client";

import { Group, Pagination, Select, Text } from "@mantine/core";

type Props = {
  total: number; // общее количество элементов
  page: number; // текущая страница
  pageSize: number; // размер страницы
  onPageChange: (p: number) => void;
  onPageSizeChange: (size: number) => void;
};

export default function AppPagination({
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: Props) {
  const totalPages = Math.ceil(total / pageSize);

  return (
    <Group justify="space-between" mt="lg">
      <Pagination value={page} onChange={onPageChange} total={totalPages} />

      <Group gap="xs">
        <Text size="sm">На странице:</Text>
        <Select
          w={80}
          value={String(pageSize)}
          onChange={(value) => onPageSizeChange(Number(value))}
          data={["5", "10", "20", "50"]}
        />
      </Group>
    </Group>
  );
}
