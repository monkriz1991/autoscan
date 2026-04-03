import React from "react";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";

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

      <Footer />
    </div>
  );
}
