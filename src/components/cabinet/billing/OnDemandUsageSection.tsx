"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Badge,
  Button,
  Card,
  Group,
  Notification,
  NumberInput,
  Stack,
  Table,
  Text,
} from "@mantine/core";
import type { BillingSummary } from "@/lib/api";
import {
  cancelOnDemandInvoice,
  createOnDemandInvoice,
  getOnDemandBalance,
  listOnDemandInvoices,
  listOnDemandTransactions,
} from "@/lib/api";
import { formatUsd } from "@/lib/formatUsd";

const MIN_TOPUP_USD = 5;

function invoiceStatusColor(s: string): string {
  if (s === "paid") return "green";
  if (s === "pending") return "yellow";
  if (s === "cancelled" || s === "expired" || s === "failed") return "red";
  return "gray";
}

type Props = {
  onDemand: BillingSummary["on_demand"];
  usedMonthUsd: string | null;
  onRefresh: () => Promise<void>;
};

/** Блок пополняемого on-demand баланса в кабинете биллинга */
export function OnDemandUsageSection({
  onDemand,
  usedMonthUsd,
  onRefresh,
}: Props) {
  const t = useTranslations("billingPage");
  const locale = useLocale();
  const [amount, setAmount] = useState<number | string>(MIN_TOPUP_USD);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [invoices, setInvoices] = useState<
    Awaited<ReturnType<typeof listOnDemandInvoices>>["results"]
  >([]);
  const [txs, setTxs] = useState<
    Awaited<ReturnType<typeof listOnDemandTransactions>>["results"]
  >([]);
  const [usdPerRequest, setUsdPerRequest] = useState(0.05);

  const loadLists = useCallback(async () => {
    try {
      const [inv, tx] = await Promise.all([
        listOnDemandInvoices(),
        listOnDemandTransactions(),
      ]);
      setInvoices(inv.results);
      setTxs(tx.results);
    } catch {
      /* списки опциональны */
    }
  }, []);

  useEffect(() => {
    void loadLists();
  }, [loadLists]);

  useEffect(() => {
    getOnDemandBalance()
      .then((b) => {
        const p = Number.parseFloat(b.usd_per_request);
        if (!Number.isNaN(p) && p > 0) setUsdPerRequest(p);
      })
      .catch(() => {});
  }, []);

  const pending = onDemand.pending_invoice;
  const balanceNum = Number.parseFloat(onDemand.balance_usd) || 0;

  const estimateForAmount = (usd: number) => {
    if (usd <= 0 || usdPerRequest <= 0) return 0;
    return Math.floor(usd / usdPerRequest);
  };

  const handleCreateInvoice = async () => {
    setError("");
    const n = typeof amount === "string" ? Number.parseFloat(amount) : amount;
    if (Number.isNaN(n) || n < MIN_TOPUP_USD) {
      setError(t("odMinError", { min: MIN_TOPUP_USD }));
      return;
    }
    setLoading(true);
    try {
      const created = await createOnDemandInvoice(n.toFixed(2));
      await onRefresh();
      await loadLists();
      if (created.payment_url) {
        window.open(created.payment_url, "_blank", "noopener,noreferrer");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t("odCreateError"));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    setError("");
    setLoading(true);
    try {
      await cancelOnDemandInvoice(id);
      await onRefresh();
      await loadLists();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("odCancelError"));
    } finally {
      setLoading(false);
    }
  };

  const est = onDemand.available_requests_estimate;
  const amtHint = typeof amount === "number" ? amount : Number.parseFloat(String(amount));
  const hintN = !Number.isNaN(amtHint) ? estimateForAmount(amtHint) : 0;

  return (
    <Stack gap="md">
      <Card withBorder p="lg" radius="md" shadow="sm">
        <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb="md">
          {t("odTitle")}
        </Text>
        {usedMonthUsd != null && Number.parseFloat(usedMonthUsd) > 0 && (
          <Text size="sm" c="dimmed" mb="sm">
            {t("odUsedMonth", { used: formatUsd(usedMonthUsd, locale) })}
          </Text>
        )}
        <Group justify="space-between" align="flex-start" wrap="wrap" mb="sm">
          <div>
            <Text size="xl" fw={700}>
              {formatUsd(onDemand.balance_usd, locale)}
            </Text>
            <Text size="sm" c="dimmed">
              {balanceNum <= 0
                ? t("odNoExtra")
                : t("odExtraRequests", { n: est })}
            </Text>
          </div>
        </Group>

        {pending ? (
          <Stack gap="sm" mt="md">
            <Text fw={600}>{t("odPendingTitle")}</Text>
            <Text size="sm">
              {t("odInvoiceNumber")}: {pending.invoice_number}
            </Text>
            <Text size="sm">{formatUsd(pending.amount_usd, locale)}</Text>
            {pending.expired_at && (
              <Text size="xs" c="dimmed">
                {t("odExpires")}: {new Date(pending.expired_at).toLocaleString()}
              </Text>
            )}
            <Group>
              {pending.invoice_url && (
                <Button
                  component="a"
                  href={pending.invoice_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="sm"
                >
                  {t("odPay")}
                </Button>
              )}
              <Button
                variant="light"
                color="gray"
                size="sm"
                onClick={() => void handleCancel(pending.id)}
                loading={loading}
              >
                {t("odCancelInvoice")}
              </Button>
            </Group>
          </Stack>
        ) : (
          <Stack gap="sm" mt="md">
            <Text size="sm" c="dimmed">
              {t("odTopUpHint")}
            </Text>
            <Group align="flex-end" wrap="wrap">
              <NumberInput
                label={t("odAmountUsd")}
                value={amount}
                onChange={setAmount}
                min={MIN_TOPUP_USD}
                step={1}
                decimalScale={2}
                w={160}
              />
              <Button
                className="btn-metallic btn-metallic-outline"
                color="silver"
                onClick={() => void handleCreateInvoice()}
                loading={loading}
                size="sm"
              >
                {t("odCreateInvoice")}
              </Button>
            </Group>
            <Text size="xs" c="dimmed">
              {t("odMinHint", { min: MIN_TOPUP_USD })} ·{" "}
              {t("odEstimateHint", {
                n: hintN,
                amount: Number.isNaN(amtHint) ? "—" : String(amtHint),
              })}
            </Text>
          </Stack>
        )}

        {error && (
          <Notification color="red" mt="md" onClose={() => setError("")}>
            {error}
          </Notification>
        )}
      </Card>

      <Card withBorder p="lg" radius="md" shadow="sm">
        <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb="md">
          {t("odInvoicesTitle")}
        </Text>
        {invoices.length === 0 ? (
          <Text size="sm" c="dimmed">
            {t("odNoInvoices")}
          </Text>
        ) : (
          <Table striped highlightOnHover verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t("odColInvoice")}</Table.Th>
                <Table.Th>{t("colAmount")}</Table.Th>
                <Table.Th>{t("colDate")}</Table.Th>
                <Table.Th>{t("colStatus")}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {invoices.map((row) => (
                <Table.Tr key={row.id}>
                  <Table.Td>{row.invoice_number}</Table.Td>
                  <Table.Td>{formatUsd(row.amount_usd, locale)}</Table.Td>
                  <Table.Td>
                    {new Date(row.created_at).toLocaleDateString()}
                  </Table.Td>
                  <Table.Td>
                    <Badge color={invoiceStatusColor(row.status)} variant="light">
                      {t(`odInvStatus_${row.status}`)}
                    </Badge>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Card>

      <Card withBorder p="lg" radius="md" shadow="sm">
        <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb="md">
          {t("odTxTitle")}
        </Text>
        {txs.length === 0 ? (
          <Text size="sm" c="dimmed">
            {t("odNoTx")}
          </Text>
        ) : (
          <Table striped highlightOnHover verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t("colDate")}</Table.Th>
                <Table.Th>{t("odColType")}</Table.Th>
                <Table.Th>{t("colAmount")}</Table.Th>
                <Table.Th>{t("odColBalanceAfter")}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {txs.map((row) => (
                <Table.Tr key={row.id}>
                  <Table.Td>
                    {new Date(row.created_at).toLocaleString()}
                  </Table.Td>
                  <Table.Td>{t(`odTx_${row.transaction_type}`)}</Table.Td>
                  <Table.Td>{formatUsd(row.amount_usd, locale)}</Table.Td>
                  <Table.Td>{formatUsd(row.balance_after_usd, locale)}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Card>
    </Stack>
  );
}
