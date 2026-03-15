"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { Avatar, Menu } from "@mantine/core";
import { IconDashboard, IconLogout, IconStethoscope } from "@tabler/icons-react";
import { isAuthenticated, logout, getMe } from "@/lib/api";
import type { UserProfile } from "@/lib/api";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Navbar() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
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

  const navLink = (href: string, label: string) => {
    const isActive = pathname === href;
    return (
      <Link
        href={href}
        className={`navbar__link ${isActive ? "navbar__link--active" : ""}`}
      >
        {label}
      </Link>
    );
  };

  const handleLogout = () => {
    logout();
    setAuthenticated(false);
    setUser(null);
    router.replace("/");
  };

  const avatarLetters = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : "?";

  return (
    <header className="navbar">
      <div className="navbar__inner">
        <Link href="/" className="navbar__logo">
          {t("brand")}
        </Link>

        <nav className="navbar__nav">
          {navLink("/", t("home"))}
          {navLink("/marketing/pricing", t("pricing"))}
          {!authenticated && navLink("/register", t("register"))}
          {!authenticated && navLink("/login", t("login"))}

          <LanguageSwitcher />

          {authenticated && (
            <Menu position="bottom-end" shadow="md" width={200}>
              <Menu.Target>
                <Avatar
                  src={user?.avatar_url}
                  radius="xl"
                  color="blue"
                  style={{ cursor: "pointer" }}
                >
                  {avatarLetters}
                </Avatar>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item
                  leftSection={<IconDashboard size={16} />}
                  component={Link}
                  href="/superadmin/dashboard"
                >
                  {t("dashboard")}
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconStethoscope size={16} />}
                  component={Link}
                  href="/business/scan/"
                >
                  {t("diagnose")}
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
        </nav>
      </div>
    </header>
  );
}
