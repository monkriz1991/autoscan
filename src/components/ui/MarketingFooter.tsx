"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

/** Футер маркетингового раздела: локализованные подписи и locale-aware ссылки. */
export default function MarketingFooter() {
  const t = useTranslations("footer");
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__copy">{t("copyright", { year })}</div>

        <div className="footer__links">
          <Link href="/marketing/privacy">{t("privacy")}</Link>
          <Link href="/marketing/terms">{t("terms")}</Link>
          <Link href="/marketing/contacts">{t("contacts")}</Link>
        </div>
      </div>
    </footer>
  );
}
