export const locales = ["en", "de", "ru", "pl", "it", "es"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, string> = {
  en: "English",
  de: "Deutsch",
  ru: "Русский",
  pl: "Polski",
  it: "Italiano",
  es: "Español",
};
