import React from "react";
import Navbar from "@/components/ui/Navbar";

export default function SuperadminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="layout layout--superadmin">
      <Navbar />
      <main className="layout__main">
        <div className="layout__content">{children}</div>
      </main>
      <footer className="layout__footer">
        © {new Date().getFullYear()} Superadmin Panel
      </footer>
    </div>
  );
}
