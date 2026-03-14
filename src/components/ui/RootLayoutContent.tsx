"use client";

import { usePathname } from "next/navigation";
import { Container } from "@mantine/core";
import Navbar from "./Navbar";
import Footer from "./Footer";

const SELF_LAYOUT_PREFIXES = ["/marketing", "/superadmin", "/business"];

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
        <Container size="lg">{children}</Container>
      </main>
      <Footer />
    </div>
  );
}
