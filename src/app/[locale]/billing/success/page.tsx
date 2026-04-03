"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Button,
  Center,
  Container,
  Loader,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { Link } from "@/i18n/navigation";
import { getPlisioPaymentStatus } from "@/lib/api";

const POLL_MS = 2000;
const MAX_POLLS = 60;

function BillingSuccessContent() {
  const t = useTranslations("billing");
  const searchParams = useSearchParams();
  const paymentIdRaw = searchParams.get("payment_id");
  const paymentId = paymentIdRaw ? parseInt(paymentIdRaw, 10) : NaN;
  const validId = Number.isFinite(paymentId) && paymentId > 0;

  const [phase, setPhase] = useState<"idle" | "polling" | "done" | "timeout" | "error">(
    validId ? "polling" : "idle",
  );
  const [errMsg, setErrMsg] = useState("");
  const polls = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!validId) return;

    let cancelled = false;
    const tick = async () => {
      try {
        const st = await getPlisioPaymentStatus(paymentId);
        if (cancelled) return;
        if (st.status === "completed") {
          setPhase("done");
          return;
        }
        polls.current += 1;
        if (polls.current >= MAX_POLLS) {
          setPhase("timeout");
          return;
        }
        timeoutRef.current = setTimeout(() => {
          timeoutRef.current = null;
          void tick();
        }, POLL_MS);
      } catch {
        if (!cancelled) {
          setErrMsg(t("statusError"));
          setPhase("error");
        }
      }
    };

    void tick();
    return () => {
      cancelled = true;
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [validId, paymentId, t]);

  if (!validId) {
    return (
      <Container size="sm" py="xl">
        <Stack gap="md">
          <Title order={2}>{t("successTitle")}</Title>
          <Text c="dimmed">{t("successNoPaymentId")}</Text>
          <Button component={Link} href="/superadmin/dashboard" variant="filled" className="btn-metallic">
            {t("goToDashboard")}
          </Button>
        </Stack>
      </Container>
    );
  }

  if (phase === "polling") {
    return (
      <Center py="xl">
        <Stack align="center" gap="md">
          <Loader size="lg" />
          <Text>{t("successPending")}</Text>
        </Stack>
      </Center>
    );
  }

  if (phase === "done") {
    return (
      <Container size="sm" py="xl">
        <Stack gap="md">
          <Title order={2}>{t("successTitle")}</Title>
          <Text>{t("successDone")}</Text>
          <Button component={Link} href="/superadmin/dashboard" variant="filled" className="btn-metallic">
            {t("goToDashboard")}
          </Button>
        </Stack>
      </Container>
    );
  }

  if (phase === "timeout" || phase === "error") {
    return (
      <Container size="sm" py="xl">
        <Stack gap="md">
          <Title order={2}>{t("successTitle")}</Title>
          <Text c="dimmed">{phase === "timeout" ? t("successTimeout") : errMsg || t("statusError")}</Text>
          <Button component={Link} href="/superadmin/dashboard" variant="light" className="btn-metallic">
            {t("goToDashboard")}
          </Button>
        </Stack>
      </Container>
    );
  }

  return null;
}

export default function BillingSuccessPage() {
  return (
    <Suspense
      fallback={
        <Center py="xl">
          <Loader size="lg" />
        </Center>
      }
    >
      <BillingSuccessContent />
    </Suspense>
  );
}
