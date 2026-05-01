"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { Menu, Button } from "@mantine/core";
import { IconLanguage } from "@tabler/icons-react";
import { routing } from "@/i18n/routing";
import { localeMenuCodes, type Locale } from "@/i18n";

export default function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const tA11y = useTranslations("a11y");

  useEffect(() => {
    setMounted(true);
  }, []);

  const switchLocale = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
  };

  const label = localeMenuCodes[locale] ?? locale.toUpperCase();

  /* Кнопка того же размера, что и с Menu: слот не схлопывается до гидратации (иначе «прыгает» шапка).
   * Menu ренерим только после mount — иначе id поповера расходятся SSR/клиент. */
  const trigger = (
    <Button
      variant="light"
      size="sm"
      color="gray"
      className="navbar__lang-btn"
      leftSection={<IconLanguage size={18} stroke={1.75} />}
      aria-label={tA11y("switchLanguage")}
      disabled={!mounted}
      tabIndex={mounted ? undefined : -1}
      style={!mounted ? { pointerEvents: "none" } : undefined}
    >
      <span className="navbar__lang-code">{label}</span>
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
                {localeMenuCodes[loc as Locale] ?? loc.toUpperCase()}
              </Menu.Item>
            ))}
          </Menu.Dropdown>
        </Menu>
      )}
    </div>
  );
}
