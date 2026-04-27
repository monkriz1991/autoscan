"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { isAuthenticated } from "@/lib/api";

/** Маленький client-island: auth state не должен тащить весь лендинг в client bundle. */
export default function AuthDashboardLink() {
  const t = useTranslations("landing.hero");
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    setAuthenticated(isAuthenticated());
  }, []);

  if (!authenticated) {
    return null;
  }

  return (
    <p style={{ margin: 0, fontSize: "0.875rem" }}>
      <Link href="/cabinet/dashboard" style={{ color: "#dbe5ff" }}>
        {t("dashboardLink")}
      </Link>
    </p>
  );
}
