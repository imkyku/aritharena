export type OperationType = 'add' | 'sub' | 'mul' | 'div';

export interface OperationIntent {
  type: OperationType;
  operand: string;
  seq: number;
}

export interface ParsedOperationIntent {
  type: OperationType;
  operand: bigint;
  seq: number;
}

export interface ElixirState {
  storedElixir: number;
  lastElixirUpdateAt: number;
}

export interface PlayerMatchState extends ElixirState {
  userId: string;
  currentValue: string;
  connected: boolean;
  surrendered: boolean;
  lastAcceptedSeq: number;
}

export interface MatchGenerationResult {
  startNumber: string;
  targetNumber: string;
  hiddenOperations: ParsedOperationIntent[];
}

export interface WinResolutionInput {
  target: string;
  playerAId: string;
  playerBId: string;
  playerAValue: string;
  playerBValue: string;
}

export interface WinResolutionResult {
  winnerId: string | null;
  isDraw: boolean;
  distances: Record<string, string>;
}
