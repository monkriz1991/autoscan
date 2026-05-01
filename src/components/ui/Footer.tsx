"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@mantine/core";
import { IconDownload } from "@tabler/icons-react";

/** Маркетинговый футер: бренд, колонки ссылок, юридический блок. */
export default function Footer() {
  const tFooter = useTranslations("footer");
  const tNav = useTranslations("nav");
  const tSeo = useTranslations("seo");
  const year = new Date().getFullYear();
  const siteName = tSeo("siteName");

  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__top">
          <div className="footer__brand-block">
            <Link href="/" className="footer__brand-link">
              {tNav("brand")}
            </Link>
            <p className="footer__tagline">{tFooter("tagline")}</p>
            <Button
              component={Link}
              href="/download"
              size="sm"
              leftSection={<IconDownload size={16} />}
              className="btn-cta-primary footer__cta"
            >
              {tNav("ctaDownload")}
            </Button>
          </div>

          <div>
            <h3 className="footer__col-title">{tFooter("colExplore")}</h3>
            <nav className="footer__col-links" aria-label={tFooter("colExplore")}>
              <Link href="/" className="footer__col-link">
                {tNav("home")}
              </Link>
              <Link href="/blog" className="footer__col-link">
                {tNav("blog")}
              </Link>
              <Link href="/dtc" className="footer__col-link">
                {tNav("dtc")}
              </Link>
              <Link href="/download" className="footer__col-link">
                {tNav("download")}
              </Link>
              <Link href="/pricing" className="footer__col-link">
                {tNav("pricing")}
              </Link>
              <Link href="/faq" className="footer__col-link">
                {tNav("faq")}
              </Link>
            </nav>
          </div>

          <div>
            <h3 className="footer__col-title">{tFooter("colLegal")}</h3>
            <nav className="footer__col-links" aria-label={tFooter("colLegal")}>
              <Link href="/terms" className="footer__col-link">
                {tFooter("terms")}
              </Link>
              <Link href="/privacy" className="footer__col-link">
                {tFooter("privacy")}
              </Link>
              <Link href="/terms#disclaimer" className="footer__col-link">
                {tFooter("disclaimer")}
              </Link>
              <Link href="/contacts" className="footer__col-link">
                {tFooter("contacts")}
              </Link>
            </nav>
          </div>
        </div>

        <div className="footer__bottom">
          <div className="footer__copy">{tFooter("copyright", { year, siteName })}</div>
          <div className="footer__links">
            <Link href="/terms">{tFooter("terms")}</Link>
            <Link href="/privacy">{tFooter("privacy")}</Link>
            <Link href="/terms#disclaimer">{tFooter("disclaimer")}</Link>
            <Link href="/contacts">{tFooter("contacts")}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
