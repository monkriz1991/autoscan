import React from "react";
import Navbar from "@/components/ui/Navbar";
import MarketingFooter from "@/components/ui/MarketingFooter";

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

      <MarketingFooter />
    </div>
  );
}
