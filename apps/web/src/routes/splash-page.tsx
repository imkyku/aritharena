import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { authWithTelegram } from '../features/auth/auth.api';
import { useAuthStore } from '../features/auth/auth.store';
import { getTelegramLaunchContext } from '../lib/telegram';
import { AppButton } from '../components/app-button';
import { ScreenShell } from '../components/screen-shell';
import { useI18n } from '../lib/i18n';

export function SplashPage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const setAuth = useAuthStore((state) => state.setAuth);
  const bootStatus = useAuthStore((state) => state.bootStatus);
  const setBootStatus = useAuthStore((state) => state.setBootStatus);
  const errorMessage = useAuthStore((state) => state.errorMessage);
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    if (token) {
      navigate('/menu', { replace: true });
      return;
    }

    const run = async () => {
      setBootStatus('loading');
      try {
        const launch = getTelegramLaunchContext();
        const authResponse = await authWithTelegram(launch.initData);
        setAuth(authResponse.accessToken, authResponse.user);
        navigate('/menu', { replace: true });
      } catch (error) {
        setBootStatus('error', (error as Error).message);
      }
    };

    void run();
  }, [navigate, setAuth, setBootStatus, token]);

  return (
    <ScreenShell title="Arithmetic Arena" subtitle="Telegram Mini App PvP">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4 rounded-2xl border border-white/10 bg-arena-panel/70 p-4"
      >
        <p>{t('boot')}</p>
        {bootStatus === 'error' ? (
          <>
            <p className="text-sm text-arena-danger">{t('bootError')}</p>
            <p className="text-xs text-slate-400">{errorMessage}</p>
            <AppButton onClick={() => window.location.reload()}>{t('retry')}</AppButton>
          </>
        ) : (
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
            <motion.div
              className="h-full bg-arena-accent"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
            />
          </div>
        )}
      </motion.div>
    </ScreenShell>
  );
}
