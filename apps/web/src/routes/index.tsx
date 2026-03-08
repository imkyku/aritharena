import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuthStore } from '../features/auth/auth.store';
import { SplashPage } from './splash-page';
import { MainMenuPage } from './main-menu-page';
import { ProfilePage } from './profile-page';
import { RankedQueuePage } from './ranked-queue-page';
import { FriendlyPage } from './friendly-page';
import { MatchPage } from './match-page';
import { MatchResultPage } from './match-result-page';
import { LeaderboardPage } from './leaderboard-page';
import { HistoryPage } from './history-page';
import { SettingsPage } from './settings-page';

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const token = useAuthStore((state) => state.token);
  if (!token) {
    return <Navigate to="/" replace />;
  }
  return children;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<SplashPage />} />
      <Route
        path="/menu"
        element={
          <ProtectedRoute>
            <MainMenuPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ranked"
        element={
          <ProtectedRoute>
            <RankedQueuePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/friendly"
        element={
          <ProtectedRoute>
            <FriendlyPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/match/:matchId"
        element={
          <ProtectedRoute>
            <MatchPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/result/:matchId"
        element={
          <ProtectedRoute>
            <MatchResultPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/leaderboard"
        element={
          <ProtectedRoute>
            <LeaderboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/history"
        element={
          <ProtectedRoute>
            <HistoryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
