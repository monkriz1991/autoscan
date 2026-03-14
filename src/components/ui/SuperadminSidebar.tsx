"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconDashboard,
  IconBuilding,
  IconChartBar,
  IconSettings,
} from "@tabler/icons-react";

const NAV_ITEMS = [
  { href: "/superadmin/dashboard", label: "Dashboard", icon: IconDashboard },
  { href: "/superadmin/dashboard/businesses", label: "Businesses", icon: IconBuilding },
  { href: "/superadmin/dashboard/analytics", label: "Analytics", icon: IconChartBar },
  { href: "/superadmin/dashboard/settings", label: "Настройки", icon: IconSettings },
];

export default function SuperadminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="layout__sidebar">
      <nav className="layout__sidebar-nav">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive =
            pathname === href ||
            (pathname.startsWith(href + "/") && href !== "/superadmin/dashboard");
          return (
            <Link
              key={href}
              href={href}
              className={`layout__sidebar-link ${isActive ? "layout__sidebar-link--active" : ""}`}
            >
              <Icon size={20} stroke={1.5} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
