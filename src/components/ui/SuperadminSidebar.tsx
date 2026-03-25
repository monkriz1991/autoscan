"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { Burger, Drawer } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconDashboard,
  IconChartBar,
  IconHistory,
  IconSettings,
  IconDeviceDesktop,
  IconCar,
} from "@tabler/icons-react";

const NAV_ITEMS = [
  { href: "/superadmin/dashboard", icon: IconDashboard },
  { href: "/superadmin/dashboard/analytics", icon: IconChartBar },
  { href: "/superadmin/dashboard/diagnostics-history", icon: IconHistory },
  { href: "/superadmin/dashboard/vehicle", icon: IconCar },
  { href: "/superadmin/dashboard/devices", icon: IconDeviceDesktop },
  { href: "/superadmin/dashboard/settings", icon: IconSettings },
];

function SidebarNav({ onLinkClick }: { onLinkClick?: () => void }) {
  const t = useTranslations("nav");
  const pathname = usePathname();

  const labels: Record<string, string> = {
    "/superadmin/dashboard": t("dashboard"),
    "/superadmin/dashboard/analytics": t("analytics"),
    "/superadmin/dashboard/diagnostics-history": t("requestHistory"),
    "/superadmin/dashboard/vehicle": t("vehicle"),
    "/superadmin/dashboard/devices": t("devices"),
    "/superadmin/dashboard/settings": t("settings"),
  };

  return (
    <nav className="layout__sidebar-nav">
      {NAV_ITEMS.map(({ href, icon: Icon }) => {
        const isActive =
          pathname === href ||
          (pathname.startsWith(href + "/") && href !== "/superadmin/dashboard");
        return (
          <Link
            key={href}
            href={href}
            className={`layout__sidebar-link ${isActive ? "layout__sidebar-link--active" : ""}`}
            onClick={onLinkClick}
          >
            <Icon size={20} stroke={1.5} />
            <span>{labels[href] ?? href}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export default function SuperadminSidebar() {
  const t = useTranslations("nav");
  const [opened, { open, close }] = useDisclosure(false);

  return (
    <>
      <aside className="layout__sidebar layout__sidebar--desktop">
        <SidebarNav />
      </aside>
      <div className="layout__mobile-header">
        <Burger
          opened={opened}
          onClick={open}
          aria-label="Open menu"
          size="sm"
        />
        <span className="layout__mobile-header-title">{t("menu")}</span>
      </div>
      <Drawer
        opened={opened}
        onClose={close}
        title={t("menu")}
        position="left"
        size="260px"
        classNames={{ content: "layout__drawer-content" }}
      >
        <SidebarNav onLinkClick={close} />
      </Drawer>
    </>
  );
}
