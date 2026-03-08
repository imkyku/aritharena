import { ScreenShell } from '../components/screen-shell';
import { useAuthStore } from '../features/auth/auth.store';

export function ProfilePage() {
  const user = useAuthStore((state) => state.user);

  return (
    <ScreenShell title="Profile" subtitle="Telegram-linked account">
      <div className="space-y-3 rounded-2xl border border-white/10 bg-arena-panel/70 p-4">
        <p>ID: {user?.telegramId}</p>
        <p>Username: {user?.username ?? '-'}</p>
        <p>Name: {user?.firstName ?? '-'} {user?.lastName ?? ''}</p>
        <p>Rating: {user?.rating ?? 1000}</p>
        <p>Games: {user?.gamesPlayed ?? 0}</p>
      </div>
    </ScreenShell>
  );
}
