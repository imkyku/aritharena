export const locales = {
  ru: 'ru',
  en: 'en',
} as const;

export type AppLocale = keyof typeof locales;
