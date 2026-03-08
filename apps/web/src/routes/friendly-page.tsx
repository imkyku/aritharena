import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppButton } from '../components/app-button';
import { ScreenShell } from '../components/screen-shell';
import { getSocket } from '../lib/socket';
import { useAuthStore } from '../features/auth/auth.store';
import { useMatchStore } from '../features/match/match.store';
import { useI18n } from '../lib/i18n';

export function FriendlyPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const setCurrentMatchId = useMatchStore((state) => state.setCurrentMatchId);

  const [code, setCode] = useState('');
  const [createdCode, setCreatedCode] = useState<string | null>(null);

  const ensureSocket = () => {
    if (!token) {
      throw new Error('Missing token');
    }
    return getSocket(token);
  };

  const createInvite = () => {
    const socket = ensureSocket();
    socket.emit('friendmatch:create', { bestOf: 1 });
    socket.once('match:event', (event) => {
      if (event?.type === 'friend_invite_created') {
        setCreatedCode(event.code as string);
      }
    });

    socket.once('matchmaking:matched', (payload: { matchId: string }) => {
      setCurrentMatchId(payload.matchId);
      navigate(`/match/${payload.matchId}`);
    });
  };

  const joinByCode = () => {
    if (!code.trim()) {
      return;
    }

    const socket = ensureSocket();
    socket.emit('friendmatch:join', { code: code.trim().toUpperCase() });
    socket.once('matchmaking:matched', (payload: { matchId: string }) => {
      setCurrentMatchId(payload.matchId);
      navigate(`/match/${payload.matchId}`);
    });
  };

  return (
    <ScreenShell title={t('friendly')} subtitle="Invite a friend">
      <div className="space-y-4 rounded-2xl border border-white/10 bg-arena-panel/70 p-4">
        <AppButton onClick={createInvite}>{t('createInvite')}</AppButton>
        {createdCode ? <p className="text-center text-xl font-bold tracking-widest">{createdCode}</p> : null}

        <input
          className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2 uppercase"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="AB12CD"
          maxLength={12}
        />
        <AppButton tone="secondary" onClick={joinByCode}>
          {t('joinInvite')}
        </AppButton>
      </div>
    </ScreenShell>
  );
}
