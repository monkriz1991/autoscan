"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Modal,
  Text,
  Stack,
  Button,
  Loader,
  Alert,
} from "@mantine/core";
import { IconExternalLink } from "@tabler/icons-react";
import { ApiError, createPlisioInvoice } from "@/lib/api";

type Props = {
  planId: number;
  planName: string;
  opened: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

/**
 * Модалка оплаты USDT TRC-20 через Plisio:
 * создаёт инвойс и перенаправляет пользователя на страницу оплаты Plisio.
 */
export function CryptoPaymentModal({
  planId,
  planName,
  opened,
  onClose,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startPayment = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await createPlisioInvoice(planId);
      if (data.invoice_url) {
        window.location.href = data.invoice_url;
      } else {
        setError("Не удалось получить ссылку на оплату.");
      }
    } catch (e: unknown) {
      const msg = e instanceof ApiError ? e.message : "Не удалось создать платёж";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [planId]);

  // Запускаем создание инвойса при открытии модала
  useEffect(() => {
    if (!opened) {
      setError(null);
      setLoading(false);
      return;
    }
    void startPayment();
  }, [opened, startPayment]);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={`Оплата ${planName} (USDT TRC-20)`}
      size="sm"
    >
      {loading && (
        <Stack align="center" py="xl">
          <Loader />
          <Text size="sm" c="dimmed">
            Создаём счёт на оплату…
          </Text>
        </Stack>
      )}

      {error && !loading && (
        <Alert color="red" title="Ошибка">
          {error}
          <Button variant="light" mt="sm" onClick={() => void startPayment()}>
            Повторить
          </Button>
        </Alert>
      )}

      {!loading && !error && (
        <Stack align="center" py="md">
          <IconExternalLink size={40} color="var(--mantine-color-teal-6)" />
          <Text size="sm" ta="center" c="dimmed">
            Перенаправляем на страницу оплаты Plisio…
          </Text>
        </Stack>
      )}
    </Modal>
  );
}
