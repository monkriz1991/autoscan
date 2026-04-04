"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { Menu, Button } from "@mantine/core";
import { IconLanguage } from "@tabler/icons-react";
import { routing } from "@/i18n/routing";

const LOCALE_NAMES: Record<string, string> = {
  en: "EN",
  de: "DE",
  ru: "RU",
  pl: "PL",
  it: "IT",
  es: "ES",
};

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const switchLocale = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
  };

  // Mantine Menu/Popover may generate runtime ids that differ between SSR and client.
  // Render it only after mount to avoid hydration mismatch.
  if (!mounted) {
    return null;
  }

  return (
    <Menu position="bottom-end" shadow="md" width={120}>
      <Menu.Target>
        <Button
          variant="subtle"
          size="sm"
          color="silver"
          leftSection={<IconLanguage size={18} />}
          aria-label="Switch language"
        >
          {LOCALE_NAMES[locale] ?? locale}
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        {routing.locales.map((loc) => (
          <Menu.Item
            key={loc}
            onClick={() => switchLocale(loc)}
            disabled={locale === loc}
          >
            {LOCALE_NAMES[loc] ?? loc}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
}
