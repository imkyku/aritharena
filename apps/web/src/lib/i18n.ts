import { useMemo } from 'react';
import { dictionary, TranslationKey } from '../locales';
import { useAuthStore } from '../features/auth/auth.store';

export function useI18n() {
  const locale = useAuthStore((state) => state.user?.locale ?? 'ru');

  return useMemo(() => {
    const dict = dictionary[locale] || dictionary.ru;
    return {
      locale,
      t: (key: TranslationKey) => dict[key],
    };
  }, [locale]);
}
