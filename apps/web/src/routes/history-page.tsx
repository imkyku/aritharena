import { useQuery } from '@tanstack/react-query';
import { ScreenShell } from '../components/screen-shell';
import { apiClient } from '../lib/api';

export function HistoryPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['history'],
    queryFn: async () => {
      const response = await apiClient.get('/me/history');
      return response.data as Array<{
        id: string;
        type: string;
        resultType: string;
        startedAt: string;
        finishedAt: string;
      }>;
    },
  });

  return (
    <ScreenShell title="Match History" subtitle="Latest finished matches">
      <div className="space-y-2">
        {isLoading ? <p>Loading...</p> : null}
        {data?.map((entry) => (
          <div key={entry.id} className="rounded-xl border border-white/10 bg-arena-panel/70 p-3">
            <p className="text-sm">{entry.id}</p>
            <p className="text-xs text-slate-400">
              {entry.type} | {entry.resultType} | {new Date(entry.finishedAt).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </ScreenShell>
  );
}
