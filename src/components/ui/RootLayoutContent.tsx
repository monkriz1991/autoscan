"use client";

import { usePathname } from "@/i18n/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";

const SELF_LAYOUT_PREFIXES = ["/marketing", "/cabinet", "/business"];

function hasOwnLayout(pathname: string): boolean {
  return SELF_LAYOUT_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export default function RootLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const useOwnLayout = hasOwnLayout(pathname ?? "");

  if (useOwnLayout) {
    return <>{children}</>;
  }

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
