"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

/** Единый футер: копирайт с названием сайта и ссылки на юридические страницы и контакты. */
export default function Footer() {
  const tFooter = useTranslations("footer");
  const tSeo = useTranslations("seo");
  const year = new Date().getFullYear();
  const siteName = tSeo("siteName");

  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__copy">{tFooter("copyright", { year, siteName })}</div>

        <div className="footer__links">
          <Link href="/marketing/terms">{tFooter("terms")}</Link>
          <Link href="/marketing/privacy">{tFooter("privacy")}</Link>
          <Link href="/marketing/disclaimer">{tFooter("disclaimer")}</Link>
          <Link href="/marketing/contacts">{tFooter("contacts")}</Link>
        </div>
      </div>
    </footer>
  );
}
