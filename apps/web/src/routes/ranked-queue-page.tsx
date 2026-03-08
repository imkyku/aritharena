import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSocket } from '../lib/socket';
import { useAuthStore } from '../features/auth/auth.store';
import { useMatchStore } from '../features/match/match.store';
import { ScreenShell } from '../components/screen-shell';
import { AppButton } from '../components/app-button';
import { useI18n } from '../lib/i18n';

export function RankedQueuePage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const token = useAuthStore((state) => state.token);
  const setQueueing = useMatchStore((state) => state.setQueueing);
  const queueing = useMatchStore((state) => state.queueing);
  const setCurrentMatchId = useMatchStore((state) => state.setCurrentMatchId);

  useEffect(() => {
    if (!token) {
      navigate('/', { replace: true });
      return;
    }

    const socket = getSocket(token);

    const onQueued = () => setQueueing(true);
    const onMatched = (payload: { matchId: string }) => {
      setQueueing(false);
      setCurrentMatchId(payload.matchId);
      navigate(`/match/${payload.matchId}`);
    };

    socket.emit('matchmaking:join', { mode: 'ranked' });
    socket.on('matchmaking:queued', onQueued);
    socket.on('matchmaking:matched', onMatched);

    return () => {
      socket.off('matchmaking:queued', onQueued);
      socket.off('matchmaking:matched', onMatched);
    };
  }, [navigate, setCurrentMatchId, setQueueing, token]);

  return (
    <ScreenShell title={t('ranked')} subtitle={t('queueing')}>
      <div className="space-y-4 rounded-2xl border border-white/10 bg-arena-panel/70 p-4">
        <p className="text-sm text-slate-300">{queueing ? t('queueing') : '...'}</p>
        <AppButton
          tone="danger"
          onClick={() => {
            if (!token) return;
            const socket = getSocket(token);
            socket.emit('matchmaking:leave');
            setQueueing(false);
            navigate('/menu');
          }}
        >
          {t('leaveQueue')}
        </AppButton>
      </div>
    </ScreenShell>
  );
}
