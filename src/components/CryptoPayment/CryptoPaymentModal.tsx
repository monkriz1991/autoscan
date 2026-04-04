"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
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
 * Модалка оплаты через Plisio: инвойс без фиксированной валюты — монету и сеть пользователь выбирает на стороне Plisio.
 */
export function CryptoPaymentModal({
  planId,
  planName,
  opened,
  onClose,
  onSuccess,
}: Props) {
  const t = useTranslations("billingPage");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startPayment = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await createPlisioInvoice(planId);
      if (data.invoice_url) {
        onSuccess();
        window.location.href = data.invoice_url;
      } else {
        setError(t("cryptoNoInvoiceUrl"));
      }
    } catch (e: unknown) {
      const msg = e instanceof ApiError ? e.message : t("cryptoCreateError");
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [planId, t, onSuccess]);

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
      title={t("cryptoModalTitle", { plan: planName })}
      size="sm"
    >
      {loading && !error && (
        <Stack align="center" py="xl">
          <Loader />
          <Text size="sm" c="dimmed" ta="center">
            {t("cryptoCreatingInvoice")}
          </Text>
          <Text size="xs" c="dimmed" ta="center">
            {t("cryptoPlisioSelectHint")}
          </Text>
        </Stack>
      )}

      {error && (
        <Alert color="red" title={t("cryptoErrorTitle")}>
          {error}
          <Button variant="light" mt="sm" onClick={() => void startPayment()}>
            {t("cryptoRetry")}
          </Button>
        </Alert>
      )}

      {!loading && !error && (
        <Stack align="center" py="md">
          <IconExternalLink size={40} color="var(--mantine-color-teal-6)" />
          <Text size="sm" ta="center" c="dimmed">
            {t("cryptoRedirecting")}
          </Text>
        </Stack>
      )}
    </Modal>
  );
}
