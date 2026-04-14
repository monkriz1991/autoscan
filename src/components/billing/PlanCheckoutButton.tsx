"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Alert, Button, Stack } from "@mantine/core";
import { Link } from "@/i18n/navigation";
import { createPlisioInvoice, getApiErrorMessage, isAuthenticated, type Plan } from "@/lib/api";

export type PlanCheckoutPlan = Pick<Plan, "id" | "price" | "name" | "tier">;

function isFreePlan(price: string | number): boolean {
  const n = typeof price === "string" ? parseFloat(price) : Number(price);
  return !Number.isFinite(n) || n <= 0;
}

export default function PlanCheckoutButton({ plan }: { plan: PlanCheckoutPlan }) {
  const t = useTranslations("pricing");
  const pathname = usePathname() || "/";
  const [authReady, setAuthReady] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setAuthed(isAuthenticated());
    setAuthReady(true);
  }, []);

  const free = isFreePlan(plan.price);
  const loginHref = `/login?next=${encodeURIComponent(pathname)}`;
  const tier = (plan.tier || "").trim().toLowerCase();

  const startPlanCta =
    tier === "lite"
      ? t("startLitePlan")
      : tier === "basic"
        ? t("startBasicPlan")
        : tier === "pro"
          ? t("startProPlan")
          : t("startPlan", { plan: plan.name });

  const handlePay = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await createPlisioInvoice(plan.id);
      if (res.invoice_url) {
        window.location.href = res.invoice_url;
        return;
      }
      setError(t("payError"));
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  if (free) {
    return (
      <Button
        className="btn-metallic"
        color="silver"
        component={Link}
        href="/register"
        variant="filled"
        mt="auto"
      >
        {t("freeChoose")}
      </Button>
    );
  }

  if (!authReady) {
    return (
      <Button className="btn-metallic" color="silver" variant="filled" mt="auto" loading disabled>
        {t("payStarting")}
      </Button>
    );
  }

  if (!authed) {
    return (
      <Button
        className="btn-metallic"
        color="silver"
        component={Link}
        href={loginHref}
        variant="filled"
        mt="auto"
      >
        {startPlanCta}
      </Button>
    );
  }

  return (
    <Stack gap="xs" mt="auto">
      {error && (
        <Alert color="red" title={t("payError")} onClose={() => setError("")} withCloseButton>
          {error}
        </Alert>
      )}
      <Button
        className="btn-metallic"
        color="silver"
        variant="filled"
        loading={loading}
        onClick={handlePay}
      >
        {loading ? t("payStarting") : t("pay")}
      </Button>
    </Stack>
  );
}
