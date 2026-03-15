import React from "react";
import Navbar from "@/components/ui/Navbar";
import SuperadminSidebar from "@/components/ui/SuperadminSidebar";
import DevBanner from "@/components/ui/DevBanner";

export default function SuperadminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="layout layout--superadmin">
      <Navbar />
      <div className="layout__body">
        <SuperadminSidebar />
        <main className="layout__main">
          <div className="layout__content">
            <DevBanner />
            {children}
          </div>
        </main>
      </div>
      <footer className="layout__footer">
        © {new Date().getFullYear()} Superadmin Panel
      </footer>
    </div>
  );
}
