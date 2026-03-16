import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "de", "ru", "pl", "it", "es"],
  defaultLocale: "en",
  localePrefix: "always",
});
