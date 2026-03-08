import { useNavigate } from 'react-router-dom';
import { AppButton } from '../components/app-button';
import { ScreenShell } from '../components/screen-shell';
import { useAuthStore } from '../features/auth/auth.store';
import { useI18n } from '../lib/i18n';

export function MainMenuPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { t } = useI18n();

  return (
    <ScreenShell
      title={t('menuTitle')}
      subtitle={`${user?.firstName ?? 'Player'} | Elo ${user?.rating ?? 1000}`}
    >
      <div className="space-y-3">
        <AppButton onClick={() => navigate('/ranked')}>{t('ranked')}</AppButton>
        <AppButton onClick={() => navigate('/friendly')} tone="secondary">
          {t('friendly')}
        </AppButton>
        <AppButton onClick={() => navigate('/profile')} tone="secondary">
          {t('profile')}
        </AppButton>
        <AppButton onClick={() => navigate('/leaderboard')} tone="secondary">
          {t('leaderboard')}
        </AppButton>
        <AppButton onClick={() => navigate('/history')} tone="secondary">
          {t('history')}
        </AppButton>
        <AppButton onClick={() => navigate('/settings')} tone="secondary">
          {t('settings')}
        </AppButton>
      </div>
    </ScreenShell>
  );
}
