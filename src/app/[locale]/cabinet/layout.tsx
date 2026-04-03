import type { Metadata } from "next";
import React from "react";
import Navbar from "@/components/ui/Navbar";
import CabinetSidebar from "@/components/ui/CabinetSidebar";
import DevBanner from "@/components/ui/DevBanner";

export async function generateMetadata(): Promise<Metadata> {
  return {
    robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
  };
}

export default function CabinetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="layout layout--cabinet">
      <Navbar />
      <div className="layout__body">
        <CabinetSidebar />
        <main className="layout__main">
          <div className="layout__content">
            <DevBanner />
            {children}
          </div>
        </main>
      </div>
      <footer className="layout__footer">
        © {new Date().getFullYear()} Autoscan
      </footer>
    </div>
  );
}
