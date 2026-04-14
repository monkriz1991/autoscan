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

  const label = LOCALE_NAMES[locale] ?? locale;

  /* Кнопка того же размера, что и с Menu: слот не схлопывается до гидратации (иначе «прыгает» шапка).
   * Menu ренерим только после mount — иначе id поповера расходятся SSR/клиент. */
  const trigger = (
    <Button
      variant="subtle"
      size="sm"
      color="silver"
      leftSection={<IconLanguage size={18} />}
      aria-label="Switch language"
      disabled={!mounted}
      tabIndex={mounted ? undefined : -1}
      style={!mounted ? { pointerEvents: "none" } : undefined}
    >
      {label}
    </Button>
  );

  return (
    <div className="navbar__lang-slot">
      {!mounted ? (
        trigger
      ) : (
        <Menu position="bottom-end" shadow="md" width={120}>
          <Menu.Target>{trigger}</Menu.Target>
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
      )}
    </div>
  );
}
