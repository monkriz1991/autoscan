import React from "react";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="layout">
      <header className="header">
        <div className="container header__inner">
          <div className="header__logo">Marketing</div>

          <nav className="header__nav">
            <a href="/">Home</a>
            <a href="/pricing">Pricing</a>
            <a href="/login">Login</a>
          </nav>
        </div>
      </header>

      <main className="layout__main">
        <div className="container">{children}</div>
      </main>

      <footer className="footer">
        <div className="container footer__inner">
          <div className="footer__copy">
            © {new Date().getFullYear()} Your Company
          </div>

          <div className="footer__links">
            <a href="/privacy">Политика</a>
            <a href="/terms">Условия</a>
            <a href="/contacts">Контакты</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
