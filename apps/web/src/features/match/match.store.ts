import { create } from 'zustand';
import type { MatchStateDto } from '@arena/shared';

interface MatchUiState {
  queueing: boolean;
  currentMatchId: string | null;
  matchState: MatchStateDto | null;
  matchFinished: { winnerId: string | null; resultType: string | null } | null;
  socketConnected: boolean;
  localSeq: number;
  setQueueing: (queueing: boolean) => void;
  setCurrentMatchId: (matchId: string | null) => void;
  setMatchState: (state: MatchStateDto | null) => void;
  setMatchFinished: (value: MatchUiState['matchFinished']) => void;
  setSocketConnected: (connected: boolean) => void;
  getNextSeq: () => number;
  resetMatch: () => void;
}

export const useMatchStore = create<MatchUiState>((set, get) => ({
  queueing: false,
  currentMatchId: null,
  matchState: null,
  matchFinished: null,
  socketConnected: false,
  localSeq: 1,
  setQueueing: (queueing) => set({ queueing }),
  setCurrentMatchId: (currentMatchId) => set({ currentMatchId }),
  setMatchState: (matchState) => {
    const maxSeq = Math.max(0, ...(matchState?.players.map((entry) => entry.lastAcceptedSeq) ?? [0]));
    set({ matchState, localSeq: Math.max(maxSeq + 1, get().localSeq) });
  },
  setMatchFinished: (matchFinished) => set({ matchFinished }),
  setSocketConnected: (socketConnected) => set({ socketConnected }),
  getNextSeq: () => {
    const next = get().localSeq;
    set({ localSeq: next + 1 });
    return next;
  },
  resetMatch: () =>
    set({
      queueing: false,
      currentMatchId: null,
      matchState: null,
      matchFinished: null,
      localSeq: 1,
    }),
}));
