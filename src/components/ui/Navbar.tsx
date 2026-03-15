"use client";

import Link from "next/link";
import { AppShell, Group, NavLink, Divider, Title, Box } from "@mantine/core";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  const isActive = (path) => pathname === path;

  return (
    <Box px="md" py="sm" style={{ borderBottom: "1px solid #eee" }}>
      <Group gap="xl" align="flex-start">
        {/* ===== SITE ===== */}
        <Box>
          <Title order={6} mb="xs">
            Site
          </Title>
          <NavLink
            component={Link}
            href="/"
            label="Home"
            active={isActive("/")}
          />
          <NavLink
            component={Link}
            href="/pricing"
            label="Pricing"
            active={isActive("/pricing")}
          />
          <NavLink
            component={Link}
            href="/register"
            label="Register"
            active={isActive("/register")}
          />
          <NavLink
            component={Link}
            href="/login"
            label="Login"
            active={isActive("/login")}
          />
        </Box>

        <Divider orientation="vertical" />

        {/* ===== ADMIN ===== */}
        <Box>
          <Title order={6} mb="xs">
            Admin
          </Title>
          {/* <NavLink
            component={Link}
            href="/admin"
            label="Dashboard"
            active={isActive("/admin")}
          /> */}
          <NavLink component={Link} href="/business/scan/" label="Diagnose" />
          <NavLink
            component={Link}
            href="/account/devices"
            label="Мои устройства"
            active={isActive("/account/devices")}
          />
        </Box>

        <Divider orientation="vertical" />

        {/* ===== SUPER ADMIN ===== */}
        <Box>
          <Title order={6} mb="xs">
            Super
          </Title>
          <NavLink
            component={Link}
            href="/superadmin/dashboard"
            label="Dashboard"
          />
          <NavLink
            component={Link}
            href="/superadmin/dashboard/businesses"
            label="Businesses"
          />
          <NavLink
            component={Link}
            href="/superadmin/dashboard/users"
            label="Users"
          />
          <NavLink
            component={Link}
            href="/superadmin/dashboard/analytics"
            label="Analytics"
          />
        </Box>
      </Group>
    </Box>
  );
}
