import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { setApiAuthToken } from '../lib/api';

export interface UserProfile {
  id: string;
  telegramId: string;
  username: string | null;
  firstName: string;
  lastName: string | null;
  rating: number;
  gamesPlayed: number;
  locale: 'ru' | 'en';
}

interface AuthState {
  token: string | null;
  user: UserProfile | null;
  bootStatus: 'idle' | 'loading' | 'ready' | 'error';
  errorMessage: string | null;
  setAuth: (token: string, user: UserProfile) => void;
  clearAuth: () => void;
  setBootStatus: (status: AuthState['bootStatus'], errorMessage?: string | null) => void;
  setLocale: (locale: 'ru' | 'en') => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      bootStatus: 'idle',
      errorMessage: null,
      setAuth: (token, user) => {
        setApiAuthToken(token);
        set({ token, user, bootStatus: 'ready', errorMessage: null });
      },
      clearAuth: () => {
        setApiAuthToken(null);
        set({ token: null, user: null, bootStatus: 'idle', errorMessage: null });
      },
      setBootStatus: (bootStatus, errorMessage = null) => set({ bootStatus, errorMessage }),
      setLocale: (locale) =>
        set((state) => ({
          user: state.user ? { ...state.user, locale } : state.user,
        })),
    }),
    {
      name: 'arena-auth',
      partialize: (state) => ({ token: state.token, user: state.user }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          setApiAuthToken(state.token);
        }
      },
    },
  ),
);
