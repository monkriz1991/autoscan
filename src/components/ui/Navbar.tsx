"use client";

import { useLayoutEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { Avatar, Burger, Button, Drawer, Menu, Stack } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconChartBar,
  IconCreditCard,
  IconDashboard,
  IconDownload,
  IconLogout,
  IconSettings,
} from "@tabler/icons-react";
import { isAuthenticated, logout, getMe } from "@/lib/api";
import type { UserProfile } from "@/lib/api";
import LanguageSwitcher from "./LanguageSwitcher";

const NAV_HREFS = [
  { href: "/", key: "home" as const },
  { href: "/marketing/pricing", key: "pricing" as const },
  { href: "/faq", key: "faq" as const },
  { href: "/download", key: "download" as const },
  { href: "/blog", key: "blog" as const },
];

export default function Navbar() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const router = useRouter();
  const [opened, { toggle, close }] = useDisclosure(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);

  /* До отрисовки: синхронно с cookie — меньше скачка «ссылки входа → аватар» после гидратации */
  useLayoutEffect(() => {
    const ok = isAuthenticated();
    setAuthenticated(ok);
    if (ok) {
      getMe()
        .then(setUser)
        .catch(() => setUser(null));
    } else {
      setUser(null);
    }
  }, [pathname]);

  const navLinkClass = (href: string) => {
    const isActive = pathname === href;
    return `navbar__link ${isActive ? "navbar__link--active" : ""}`;
  };

  const drawerLinkClass = (href: string) => {
    const isActive = pathname === href;
    return `navbar__drawer-link ${isActive ? "navbar__drawer-link--active" : ""}`;
  };

  const handleLogout = () => {
    logout();
    setAuthenticated(false);
    setUser(null);
    router.replace("/");
    close();
  };

  const avatarLetters = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : "?";

  return (
    <header className="navbar">
      <div className="navbar__inner">
        <div className="navbar__brand">
          <Link href="/" className="navbar__logo">
            {t("brand")}
          </Link>
          <span className="navbar__badge">{t("badge")}</span>
        </div>

        <nav className="navbar__desktop-only" aria-label="Main">
          {NAV_HREFS.map(({ href, key }) => (
            <Link key={href} href={href} className={navLinkClass(href)}>
              {t(key)}
            </Link>
          ))}
        </nav>

        <div className="navbar__nav">
          <div className="navbar__cta-wrap">
            <Button
              component={Link}
              href="/download"
              size="sm"
              leftSection={<IconDownload size={16} />}
              className="btn-metallic"
            >
              {t("ctaDownload")}
            </Button>
          </div>

          <div className="navbar__auth-desktop">
            {!authenticated && (
              <>
                <Link href="/register" className={navLinkClass("/register")}>
                  {t("register")}
                </Link>
                <Link href="/login" className={navLinkClass("/login")}>
                  {t("login")}
                </Link>
              </>
            )}
          </div>

          <LanguageSwitcher />

          {authenticated && (
            <Menu position="bottom-end" shadow="md" width={200}>
              <Menu.Target>
                <Avatar
                  src={user?.avatar_url}
                  radius="xl"
                  color="silver"
                  style={{ cursor: "pointer" }}
                >
                  {avatarLetters}
                </Avatar>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item
                  leftSection={<IconDashboard size={16} />}
                  component={Link}
                  href="/cabinet/dashboard"
                >
                  {t("dashboard")}
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconCreditCard size={16} />}
                  component={Link}
                  href="/cabinet/dashboard/billing"
                >
                  {t("billing")}
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconChartBar size={16} />}
                  component={Link}
                  href="/cabinet/dashboard/analytics"
                >
                  {t("analytics")}
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconSettings size={16} />}
                  component={Link}
                  href="/cabinet/dashboard/settings"
                >
                  {t("settings")}
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  leftSection={<IconLogout size={16} />}
                  color="red"
                  onClick={handleLogout}
                >
                  {t("logout")}
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          )}

          <div className="navbar__mobile-only">
            <Burger opened={opened} onClick={toggle} size="sm" aria-label={t("menu")} />
          </div>
        </div>
      </div>

      <Drawer
        opened={opened}
        onClose={close}
        position="right"
        size="min(100%, 320px)"
        title={t("menu")}
        padding="md"
      >
        <Stack gap={0}>
          {NAV_HREFS.map(({ href, key }) => (
            <Link
              key={href}
              href={href}
              className={drawerLinkClass(href)}
              onClick={close}
            >
              {t(key)}
            </Link>
          ))}
          {!authenticated && (
            <>
              <Link
                href="/register"
                className={drawerLinkClass("/register")}
                onClick={close}
              >
                {t("register")}
              </Link>
              <Link
                href="/login"
                className={drawerLinkClass("/login")}
                onClick={close}
              >
                {t("login")}
              </Link>
            </>
          )}
          <Button
            component={Link}
            href="/download"
            className="btn-metallic"
            leftSection={<IconDownload size={18} />}
            mt="md"
            fullWidth
            onClick={close}
          >
            {t("ctaDownload")}
          </Button>
        </Stack>
      </Drawer>
    </header>
  );
}
