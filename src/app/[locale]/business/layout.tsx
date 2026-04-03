import type { Metadata } from "next";
import React from "react";
import Navbar from "@/components/ui/Navbar";

export async function generateMetadata(): Promise<Metadata> {
  return {
    robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
  };
}

export default function AdminLayout({
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
          <div className="footer__copy">© {new Date().getFullYear()} Business Panel</div>
        </div>
      </footer>
    </div>
  );
}
