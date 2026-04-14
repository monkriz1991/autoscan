"use client";

import { useEffect, useState } from "react";
import { usePathname } from "@/i18n/navigation";
import {
  getLayoutChromeKind,
  type LayoutChromeKind,
} from "@/lib/middleware-pathname";
import Navbar from "./Navbar";
import Footer from "./Footer";

const SELF_LAYOUT_PREFIXES = ["/marketing", "/cabinet", "/business"];

function hasOwnLayout(pathname: string): boolean {
  return SELF_LAYOUT_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export default function RootLayoutContent({
  children,
  chromeKindFromServer,
}: {
  children: React.ReactNode;
  /** Из middleware + headers() в layout: одинаково на SSR и при гидратации. */
  chromeKindFromServer?: LayoutChromeKind;
}) {
  const pathname = usePathname() ?? "";
  const useOwnLayout = hasOwnLayout(pathname);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const chromeKind: LayoutChromeKind = mounted
    ? getLayoutChromeKind(pathname)
    : chromeKindFromServer ?? getLayoutChromeKind(pathname);

  const isHome = chromeKind === "home";
  const isLanding = chromeKind === "landing";

  const layoutClassName = [
    "layout",
    isHome && "layout--home",
    isLanding && "layout--landing",
  ]
    .filter(Boolean)
    .join(" ");

  const mainClassName = [
    "layout__main",
    isHome && "layout__main--home",
    isLanding && "layout__main--landing",
  ]
    .filter(Boolean)
    .join(" ");

  if (useOwnLayout) {
    return <>{children}</>;
  }

  return (
    <div className={layoutClassName}>
      <Navbar />
      <main className={mainClassName}>
        <div className="container">{children}</div>
      </main>
      <Footer />
    </div>
  );
}
