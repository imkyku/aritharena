import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import { useAuthStore } from '../features/auth/auth.store';
import { useMatchStore } from '../features/match/match.store';
import { ScreenShell } from '../components/screen-shell';
import { AppButton } from '../components/app-button';

export function MatchResultPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const finished = useMatchStore((state) => state.matchFinished);
  const resetMatch = useMatchStore((state) => state.resetMatch);

  const { data } = useQuery({
    queryKey: ['match', matchId],
    enabled: Boolean(matchId),
    queryFn: async () => {
      const response = await apiClient.get(`/matches/${matchId}`);
      return response.data;
    },
  });

  const message = useMemo(() => {
    if (!user || !finished) {
      return 'Match finished';
    }

    if (!finished.winnerId) {
      return 'Draw';
    }

    return finished.winnerId === user.id ? 'Victory' : 'Defeat';
  }, [finished, user]);

  return (
    <ScreenShell title="Result" subtitle={message}>
      <div className="space-y-3 rounded-2xl border border-white/10 bg-arena-panel/70 p-4">
        <p>Match ID: {matchId}</p>
        <p>Result Type: {finished?.resultType ?? data?.resultType ?? '-'}</p>
        <p>Winner: {finished?.winnerId ?? data?.winnerId ?? 'Draw'}</p>
        <AppButton
          onClick={() => {
            resetMatch();
            navigate('/menu');
          }}
        >
          Back to menu
        </AppButton>
      </div>
    </ScreenShell>
  );
}
