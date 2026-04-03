import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  return {
    robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
  };
}

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return children;
}
