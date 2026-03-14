import React from "react";
import Navbar from "@/components/ui/Navbar";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="layout">
      <Navbar />

      <main className="layout__main">
        <div className="container">{children}</div>
      </main>

      <footer className="footer">
        <div className="container footer__inner">
          <div className="footer__copy">
            © {new Date().getFullYear()} Your Company
          </div>

          <div className="footer__links">
            <a href="/marketing/privacy">Политика</a>
            <a href="/marketing/terms">Условия</a>
            <a href="/marketing/contacts">Контакты</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
