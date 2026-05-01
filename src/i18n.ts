import { routing, type AppLocale } from "@/i18n/routing";

export { SUPPORTED_LOCALES } from "@/i18n/routing";

/** Алиас к `routing.locales` — тот же порядок, что в middleware и URL. */
export const locales = routing.locales;
export type Locale = AppLocale;
export const defaultLocale = routing.defaultLocale as Locale;

/** Полные названия языков в меню переключателя (как в старом UI). */
export const localeNames: Record<Locale, string> = {
  en: "English",
  de: "Deutsch",
  ru: "Русский",
  pl: "Polski",
  it: "Italiano",
  es: "Español",
};

/** Короткие коды на кнопке переключателя (EN / DE / …). */
export const localeMenuCodes: Record<Locale, string> = {
  en: "EN",
  ru: "RU",
  de: "DE",
  pl: "PL",
  es: "ES",
  it: "IT",
};

