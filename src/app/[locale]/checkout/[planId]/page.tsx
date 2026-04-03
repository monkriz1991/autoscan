"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import {
  Alert,
  Badge,
  Button,
  Card,
  Center,
  Container,
  Divider,
  Group,
  Loader,
  Notification,
  Radio,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { IconCurrencyBitcoin } from "@tabler/icons-react";
import {
  ApiError,
  getPlanById,
  isAuthenticated,
  type PaymentMethodId,
  type Plan,
} from "@/lib/api";
import { CryptoPaymentModal } from "@/components/CryptoPayment/CryptoPaymentModal";

/** Способы оплаты на витрине; при добавлении шлюзов — новые элементы и ветки в handlePay. */
const PAYMENT_METHODS: {
  id: PaymentMethodId;
  available: boolean;
}[] = [
  {
    id: "crypto_trc20",
    available: true,
  },
];

function formatDuration(
  days: number | null,
  t: (key: string, values?: { count: number }) => string,
): string {
  if (days === null) return t("unlimited");
  if (days === 30) return t("month");
  if (days === 365) return t("year");
  return t("days", { count: days });
}

export default function CheckoutPlanPage() {
  const t = useTranslations("checkout");
  const tPricing = useTranslations("pricing");
  const router = useRouter();
  const params = useParams<{ planId: string }>();
  const planIdNum = Number.parseInt(params.planId ?? "", 10);

  const [plan, setPlan] = useState<Plan | null>(null);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>("crypto_trc20");
  const [cryptoModalOpen, setCryptoModalOpen] = useState(false);

  const isFreeTier = plan ? plan.tier === "free" : false;
  const authenticated = isAuthenticated();

  const loadPlan = useCallback(async () => {
    if (!Number.isFinite(planIdNum) || planIdNum < 1) {
      setPlan(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError("");
    try {
      const p = await getPlanById(planIdNum);
      setPlan(p);
    } catch (e) {
      setLoadError(
        e instanceof ApiError ? e.message : tPricing("loadError"),
      );
      setPlan(null);
    } finally {
      setLoading(false);
    }
  }, [planIdNum, tPricing]);

  useEffect(() => {
    void loadPlan();
  }, [loadPlan]);

  const defaultMethod = useMemo(() => {
    const first = PAYMENT_METHODS.find((m) => m.available);
    return first?.id ?? "crypto_trc20";
  }, []);

  useEffect(() => {
    setPaymentMethod(defaultMethod);
  }, [defaultMethod]);

  const handlePay = () => {
    if (!plan || isFreeTier) return;
    if (paymentMethod === "crypto_trc20") {
      setCryptoModalOpen(true);
    }
  };

  if (loading) {
    return (
      <Center py="xl">
        <Loader size="lg" />
      </Center>
    );
  }

  if (loadError) {
    return (
      <Container size="sm" py="xl">
        <Stack gap="md">
          <Title order={2}>{t("title")}</Title>
          <Notification color="red" onClose={() => setLoadError("")}>
            {loadError}
          </Notification>
          <Group>
            <Button variant="light" onClick={() => void loadPlan()}>
              {t("retry")}
            </Button>
            <Button component={Link} href="/marketing/pricing" variant="default">
              {t("back")}
            </Button>
          </Group>
        </Stack>
      </Container>
    );
  }

  if (!Number.isFinite(planIdNum) || planIdNum < 1 || !plan) {
    return (
      <Container size="sm" py="xl">
        <Stack gap="md">
          <Title order={2}>{t("title")}</Title>
          <Alert color="red">{t("notFound")}</Alert>
          <Button component={Link} href="/marketing/pricing" variant="light">
            {t("back")}
          </Button>
        </Stack>
      </Container>
    );
  }

  const p = plan;

  return (
    <Container size="sm" py="xl">
      <Stack gap="lg">
        <Title order={1}>{t("title")}</Title>

        {!authenticated && (
          <Alert color="orange" title={t("loginRequired")}>
            <Button
              component={Link}
              href={`/login?next=${encodeURIComponent(`/checkout/${p.id}`)}`}
              mt="sm"
              size="sm"
            >
              {t("loginButton")}
            </Button>
          </Alert>
        )}

        <Card withBorder shadow="sm" radius="md" p="lg">
          <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb="sm">
            {t("summary")}
          </Text>
          <Group justify="space-between" mb="xs">
            <Text fw={600}>{t("plan")}</Text>
            <Group gap="xs">
              <Text>{p.name}</Text>
              <Badge variant="light">{p.tier}</Badge>
            </Group>
          </Group>
          <Group justify="space-between" mb="xs">
            <Text c="dimmed">{t("duration")}</Text>
            <Text>{formatDuration(p.duration_days, tPricing)}</Text>
          </Group>
          <Text size="sm" c="dimmed" mb="xs">
            {tPricing("devices", { count: p.max_devices })}
          </Text>
          {p.max_requests != null && (
            <Group justify="space-between" mb="xs">
              <Text c="dimmed">{t("requests")}</Text>
              <Text>{p.max_requests}</Text>
            </Group>
          )}
          <Divider my="md" />
          <Group justify="space-between" mb="xs">
            <Text c="dimmed">{t("price")}</Text>
            <Text>
              {p.price} {p.currency}
            </Text>
          </Group>
          <Group justify="space-between">
            <Text fw={700} size="lg">
              {t("total")}
            </Text>
            <Text fw={700} size="lg">
              {p.price} {p.currency}
            </Text>
          </Group>
          {authenticated && !isFreeTier && (
            <Text size="xs" c="dimmed" mt="sm">
              {t("cryptoTotalHint")}
            </Text>
          )}
        </Card>

        {isFreeTier ? (
          <Stack gap="md">
            <Alert color="blue">{t("freeNoPayment")}</Alert>
            <Button component={Link} href="/marketing/pricing" variant="light">
              {t("back")}
            </Button>
          </Stack>
        ) : (
          <>
            <div>
              <Text fw={600} mb="sm">
                {t("paymentMethod")}
              </Text>
              <Radio.Group
                value={paymentMethod}
                onChange={(v) => setPaymentMethod(v as PaymentMethodId)}
              >
                <Stack gap="xs">
                  {PAYMENT_METHODS.filter((m) => m.available).map((m) => (
                    <Radio
                      key={m.id}
                      value={m.id}
                      label={
                        <Group gap="xs" wrap="nowrap">
                          <IconCurrencyBitcoin size={18} aria-hidden />
                          <span>{t("methodCryptoTrc20")}</span>
                        </Group>
                      }
                    />
                  ))}
                </Stack>
              </Radio.Group>
            </div>

            <Group>
              <Button
                component={Link}
                href="/marketing/pricing"
                variant="default"
              >
                {t("back")}
              </Button>
              <Button
                className="btn-metallic"
                color="teal"
                onClick={handlePay}
                disabled={!authenticated}
              >
                {t("pay")}
              </Button>
            </Group>
          </>
        )}
      </Stack>

      {!isFreeTier && (
        <CryptoPaymentModal
          planId={p.id}
          planName={p.name}
          opened={cryptoModalOpen}
          onClose={() => setCryptoModalOpen(false)}
          onSuccess={() => {
            setCryptoModalOpen(false);
            router.push("/cabinet/dashboard");
          }}
        />
      )}
    </Container>
  );
}
