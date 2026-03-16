"use client";

import { useState } from "react";
import {
  Card,
  Text,
  Stack,
  Badge,
  Collapse,
  Button,
  Group,
} from "@mantine/core";
import { mockErrors } from "@/lib/mockErrors";

export default function ScanPage() {
  const [openedCode, setOpenedCode] = useState<string | null>(null);

  return (
    <Stack p="xl" gap="md">
      <Text size="xl" fw={700}>
        Диагностика двигателя
      </Text>

      {mockErrors.length === 0 ? (
        <Card withBorder>
          <Text c="green">Ошибок не найдено</Text>
        </Card>
      ) : (
        mockErrors.map((error) => (
          <Card key={error.code} withBorder shadow="sm">
            <Group justify="space-between">
              <div>
                <Group>
                  <Text fw={700}>{error.code}</Text>
                  <Badge
                    color={
                      error.severity === "high"
                        ? "red"
                        : error.severity === "medium"
                          ? "orange"
                          : "silver"
                    }
                  >
                    {error.severity}
                  </Badge>
                </Group>
                <Text size="sm" c="dimmed">
                  {error.title}
                </Text>
              </div>

              <Button
                variant="light"
                onClick={() =>
                  setOpenedCode(openedCode === error.code ? null : error.code)
                }
              >
                {openedCode === error.code ? "Скрыть" : "Подробнее"}
              </Button>
            </Group>

            <Collapse in={openedCode === error.code}>
              <Stack mt="md" gap="xs">
                <Text>{error.description}</Text>

                <Text fw={600}>Возможные причины:</Text>
                <ul>
                  {error.possibleCauses.map((cause, idx) => (
                    <li key={idx}>
                      <Text size="sm">{cause}</Text>
                    </li>
                  ))}
                </ul>

                <Group>
                  <Button variant="outline">Показать схему</Button>
                  <Button>Анализировать через AI</Button>
                </Group>
              </Stack>
            </Collapse>
          </Card>
        ))
      )}
    </Stack>
  );
}
