import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppButton } from '../components/app-button';
import { ElixirBar } from '../components/elixir-bar';
import { OperationPanel } from '../components/operation-panel';
import { ScreenShell } from '../components/screen-shell';
import { useAuthStore } from '../features/auth/auth.store';
import { useMatchStore } from '../features/match/match.store';
import { getSocket } from '../lib/socket';
import { recomputeElixir } from '@arena/shared';

function formatMs(ms: number): string {
  const safe = Math.max(0, Math.floor(ms / 1000));
  const min = Math.floor(safe / 60)
    .toString()
    .padStart(2, '0');
  const sec = (safe % 60).toString().padStart(2, '0');
  return `${min}:${sec}`;
}

export function MatchPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);

  const matchState = useMatchStore((state) => state.matchState);
  const setMatchState = useMatchStore((state) => state.setMatchState);
  const setMatchFinished = useMatchStore((state) => state.setMatchFinished);
  const setSocketConnected = useMatchStore((state) => state.setSocketConnected);
  const socketConnected = useMatchStore((state) => state.socketConnected);

  const [error, setError] = useState<string | null>(null);
  const [tickNow, setTickNow] = useState(Date.now());
  const [serverOffset, setServerOffset] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTickNow(Date.now()), 500);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!token || !matchId) {
      navigate('/menu', { replace: true });
      return;
    }

    const socket = getSocket(token);

    const onConnect = () => setSocketConnected(true);
    const onDisconnect = () => setSocketConnected(false);

    const onState = (payload: typeof matchState) => {
      if (!payload || payload.matchId !== matchId) {
        return;
      }
      setServerOffset(payload.serverNow - Date.now());
      setMatchState(payload);
    };

    const onFinished = (payload: { matchId: string; winnerId: string | null; resultType: string | null }) => {
      if (payload.matchId !== matchId) {
        return;
      }
      setMatchFinished({ winnerId: payload.winnerId, resultType: payload.resultType });
      navigate(`/result/${matchId}`);
    };

    const onError = (payload: { message: string }) => {
      setError(payload.message);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('match:state', onState);
    socket.on('match:finished', onFinished);
    socket.on('match:error', onError);

    socket.emit('match:join', { matchId });

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('match:state', onState);
      socket.off('match:finished', onFinished);
      socket.off('match:error', onError);
    };
  }, [matchId, navigate, setMatchFinished, setMatchState, setSocketConnected, token]);

  const [myPlayer, enemyPlayer] = useMemo(() => {
    if (!matchState || !user) {
      return [null, null];
    }

    const me = matchState.players.find((player) => player.userId === user.id) ?? null;
    const enemy = matchState.players.find((player) => player.userId !== user.id) ?? null;
    return [me, enemy];
  }, [matchState, user]);

  const remaining = matchState ? matchState.expiresAt - (tickNow + serverOffset) : 0;

  const myElixir = myPlayer
    ? recomputeElixir(myPlayer.storedElixir, myPlayer.lastElixirUpdateAt, tickNow + serverOffset).actualElixir
    : 0;

  const sendOperation = (type: 'add' | 'sub' | 'mul' | 'div', operand: string) => {
    if (!token || !matchId || !myPlayer) {
      return;
    }

    const socket = getSocket(token);
    socket.emit('match:operation', {
      matchId,
      seq: myPlayer.lastAcceptedSeq + 1,
      type,
      operand,
      clientSentAt: Date.now(),
    });
  };

  return (
    <ScreenShell title="Live Match" subtitle={matchId ?? ''}>
      {matchState && myPlayer && enemyPlayer ? (
        <div className="space-y-3">
          <section className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-arena-panel/70 p-3">
              <p className="text-xs text-slate-400">Target</p>
              <p className="break-all font-display text-xl">{matchState.targetNumber}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-arena-panel/70 p-3">
              <p className="text-xs text-slate-400">Timer</p>
              <p className="font-display text-2xl">{formatMs(remaining)}</p>
            </div>
          </section>

          <section className="space-y-2 rounded-2xl border border-white/10 bg-arena-panel/70 p-3">
            <p className="text-xs text-slate-400">Your Value</p>
            <p className="break-all font-display text-lg">{myPlayer.currentValue}</p>
            <ElixirBar value={myElixir} />
          </section>

          <section className="space-y-2 rounded-2xl border border-white/10 bg-arena-panel/70 p-3">
            <p className="text-xs text-slate-400">Opponent Value</p>
            <p className="break-all font-display text-lg">{enemyPlayer.currentValue}</p>
            <ElixirBar
              value={
                recomputeElixir(enemyPlayer.storedElixir, enemyPlayer.lastElixirUpdateAt, tickNow + serverOffset)
                  .actualElixir
              }
            />
          </section>

          <OperationPanel
            currentValue={myPlayer.currentValue}
            storedElixir={myPlayer.storedElixir}
            lastElixirUpdateAt={myPlayer.lastElixirUpdateAt}
            disabled={remaining <= 0}
            onSubmit={sendOperation}
          />

          <AppButton
            tone="danger"
            onClick={() => {
              if (!token || !matchId) {
                return;
              }
              const socket = getSocket(token);
              socket.emit('match:surrender', { matchId });
            }}
          >
            Surrender
          </AppButton>

          <p className="text-xs text-slate-400">
            {socketConnected ? 'Connection active' : 'Reconnecting...'}
          </p>

          {error ? <p className="text-xs text-arena-danger">{error}</p> : null}
        </div>
      ) : (
        <p className="text-sm text-slate-300">Syncing match state...</p>
      )}
    </ScreenShell>
  );
}
