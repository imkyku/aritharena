import { useQuery } from '@tanstack/react-query';
import { ScreenShell } from '../components/screen-shell';
import { apiClient } from '../lib/api';

export function LeaderboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      const response = await apiClient.get('/leaderboard?limit=50');
      return response.data as Array<{
        rank: number;
        firstName: string;
        username: string | null;
        rating: number;
      }>;
    },
  });

  return (
    <ScreenShell title="Leaderboard" subtitle="Top rated players">
      <div className="space-y-2">
        {isLoading ? <p>Loading...</p> : null}
        {data?.map((entry) => (
          <div
            key={entry.rank}
            className="flex items-center justify-between rounded-xl border border-white/10 bg-arena-panel/70 px-3 py-2"
          >
            <p>
              #{entry.rank} {entry.firstName} {entry.username ? `(@${entry.username})` : ''}
            </p>
            <p className="font-display">{entry.rating}</p>
          </div>
        ))}
      </div>
    </ScreenShell>
  );
}
