import { useState } from 'react';
import { ScreenShell } from '../components/screen-shell';
import { AppButton } from '../components/app-button';
import { useAuthStore } from '../features/auth/auth.store';
import { useI18n } from '../lib/i18n';
import { apiClient } from '../lib/api';

export function SettingsPage() {
  const { t } = useI18n();
  const user = useAuthStore((state) => state.user);
  const setLocale = useAuthStore((state) => state.setLocale);
  const [locale, setLocaleValue] = useState<'ru' | 'en'>(user?.locale ?? 'ru');

  return (
    <ScreenShell title={t('settings')} subtitle="Language and help">
      <div className="space-y-3 rounded-2xl border border-white/10 bg-arena-panel/70 p-4">
        <label className="text-sm">{t('language')}</label>
        <select
          className="w-full rounded-lg border border-white/10 bg-slate-900 px-2 py-2"
          value={locale}
          onChange={(event) => setLocaleValue(event.target.value as 'ru' | 'en')}
        >
          <option value="ru">{t('russian')}</option>
          <option value="en">{t('english')}</option>
        </select>
        <AppButton
          onClick={async () => {
            await apiClient.patch('/me/locale', { locale });
            setLocale(locale);
          }}
        >
          {t('save')}
        </AppButton>
      </div>
    </ScreenShell>
  );
}
