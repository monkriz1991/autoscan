"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import {
  IconDashboard,
  IconBuilding,
  IconChartBar,
  IconSettings,
  IconDeviceDesktop,
} from "@tabler/icons-react";

export default function SuperadminSidebar() {
  const t = useTranslations("nav");
  const pathname = usePathname();

  const NAV_ITEMS = [
    { href: "/superadmin/dashboard", label: t("dashboard"), icon: IconDashboard },
    { href: "/superadmin/dashboard/businesses", label: t("businesses"), icon: IconBuilding },
    { href: "/superadmin/dashboard/analytics", label: t("analytics"), icon: IconChartBar },
    { href: "/superadmin/dashboard/devices", label: t("devices"), icon: IconDeviceDesktop },
    { href: "/superadmin/dashboard/settings", label: t("settings"), icon: IconSettings },
  ];

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
