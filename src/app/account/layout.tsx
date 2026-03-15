"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { Box, Group, NavLink, Title } from "@mantine/core";
import { IconDeviceDesktop, IconUser } from "@tabler/icons-react";

export default function AccountLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <Box>
      <Title order={3} mb="lg">
        Личный кабинет
      </Title>
      <Group align="flex-start" gap="xl">
        <Box miw={200}>
          <NavLink
            component={Link}
            href="/account/devices"
            label="Активные устройства"
            leftSection={<IconDeviceDesktop size={20} />}
            active={pathname === "/account/devices"}
          />
          <NavLink
            component={Link}
            href="/account"
            label="Профиль"
            leftSection={<IconUser size={20} />}
          />
        </Box>
        <Box style={{ flex: 1 }}>{children}</Box>
      </Group>
    </Box>
  );
}
