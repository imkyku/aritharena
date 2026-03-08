import { en } from './en';
import { ru } from './ru';

export const dictionary = {
  ru,
  en,
};

export type TranslationKey = keyof typeof ru;
