"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Modal,
  Text,
  Stack,
  CopyButton,
  Button,
  Loader,
  Code,
  Alert,
} from "@mantine/core";
import { QRCodeSVG } from "qrcode.react";
import {
  ApiError,
  createCryptoOrder,
  getCryptoOrderStatus,
  type CryptoPaymentOrder,
} from "@/lib/api";

type Props = {
  planId: number;
  planName: string;
  opened: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

/**
 * Модалка оплаты USDT TRC-20: создание ордера, QR на адрес, polling статуса.
 */
export function CryptoPaymentModal({
  planId,
  planName,
  opened,
  onClose,
  onSuccess,
}: Props) {
  const [order, setOrder] = useState<CryptoPaymentOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);

  const resetForClose = useCallback(() => {
    setOrder(null);
    setError(null);
    setLoading(false);
    setTimeLeft(0);
  }, []);

  const createOrder = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await createCryptoOrder(planId);
      setOrder(data);
    } catch (e: unknown) {
      const msg = e instanceof ApiError ? e.message : "Не удалось создать ордер";
      setError(msg);
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [planId]);

  useEffect(() => {
    if (!opened) {
      resetForClose();
      return;
    }
    void createOrder();
  }, [opened, planId, createOrder, resetForClose]);

  useEffect(() => {
    if (!order || order.status !== "pending") return;
    const interval = setInterval(async () => {
      try {
        const data = await getCryptoOrderStatus(order.id);
        setOrder(data);
        if (data.status === "confirmed") {
          clearInterval(interval);
          onSuccess();
        }
      } catch {
        // сеть / 401 — оставляем предыдущее состояние
      }
    }, 10_000);
    return () => clearInterval(interval);
  }, [order, onSuccess]);

  useEffect(() => {
    if (!order) return;
    const calc = () => {
      const diff = Math.max(
        0,
        Math.floor((new Date(order.expires_at).getTime() - Date.now()) / 1000),
      );
      setTimeLeft(diff);
    };
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [order]);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={`Оплата ${planName} (USDT TRC-20)`}
      size="md"
    >
      {loading && (
        <Stack align="center" py="md">
          <Loader />
          <Text size="sm" c="dimmed">
            Создаём ордер…
          </Text>
        </Stack>
      )}

      {error && !loading && (
        <Alert color="red" title="Ошибка">
          {error}
          <Button variant="light" mt="sm" onClick={() => void createOrder()}>
            Повторить
          </Button>
        </Alert>
      )}

      {order && order.status === "pending" && !loading && (
        <Stack>
          <Text size="sm" c="dimmed">
            Переведите точную сумму на адрес (сеть TRON, контракт USDT TRC-20):
          </Text>
          <QRCodeSVG
            value={order.pay_address}
            size={180}
            style={{ margin: "0 auto", display: "block" }}
          />
          <CopyButton value={order.pay_address}>
            {({ copied, copy }) => (
              <Button variant="light" onClick={copy} fullWidth>
                {copied ? "Скопировано!" : order.pay_address}
              </Button>
            )}
          </CopyButton>
          <Alert title="Сумма к оплате" color="teal">
            <Code>{order.amount_usdt} USDT</Code>
            <Text size="xs" mt={4}>
              Сеть: TRON (TRC-20)
            </Text>
          </Alert>
          <Text size="sm" c="orange" ta="center">
            Осталось времени: {formatTime(timeLeft)}
          </Text>
          <Loader size="xs" mx="auto" />
          <Text size="xs" c="dimmed" ta="center">
            Ожидаем подтверждение в блокчейне…
          </Text>
        </Stack>
      )}

      {order && order.status === "confirmed" && (
        <Alert color="green" title="Оплата подтверждена!">
          Подписка активирована.
          {order.txid ? (
            <>
              {" "}
              TxID: <Code>{order.txid}</Code>
            </>
          ) : null}
        </Alert>
      )}

      {order && order.status === "expired" && (
        <Alert color="red" title="Ордер истёк">
          <Button onClick={() => void createOrder()} mt="sm">
            Создать новый ордер
          </Button>
        </Alert>
      )}

      {order && order.status === "failed" && (
        <Alert color="red" title="Ошибка оплаты">
          Обратитесь в поддержку или создайте новый ордер.
          <Button onClick={() => void createOrder()} mt="sm" variant="light">
            Новый ордер
          </Button>
        </Alert>
      )}
    </Modal>
  );
}
