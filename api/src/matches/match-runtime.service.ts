import {
  Injectable,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
  BadRequestException,
} from '@nestjs/common';
import {
  applyOperation,
  getOperationCost,
  parseOperation,
  resolveClosestWinner,
  spendElixir,
  socketOperationSchema,
  GAME_DURATION_MS,
  matchStateSchema,
} from '@arena/shared';
import { MatchDocument } from './schemas/match.schema.js';
import { MatchesService } from './matches.service.js';
import { RedisService } from '../common/redis/redis.service.js';
import { AppLogger } from '../common/logger/app-logger.service.js';

export interface RuntimePlayerState {
  userId: string;
  currentValue: string;
  storedElixir: number;
  lastElixirUpdateAt: number;
  connected: boolean;
  surrendered: boolean;
  lastAcceptedSeq: number;
}

export interface RuntimeMatchState {
  matchId: string;
  type: 'ranked' | 'friendly';
  status: 'active' | 'finished';
  startNumber: string;
  targetNumber: string;
  startedAt: number;
  expiresAt: number;
  version: number;
  winnerId: string | null;
  resultType: 'exact' | 'closest' | 'surrender' | 'draw' | null;
  players: RuntimePlayerState[];
}

@Injectable()
export class MatchRuntimeService implements OnModuleInit, OnModuleDestroy {
  private readonly activeMatches = new Map<string, RuntimeMatchState>();
  private readonly finalizing = new Set<string>();
  private sweepTimer?: NodeJS.Timeout;

  constructor(
    private readonly matchesService: MatchesService,
    private readonly redisService: RedisService,
    private readonly logger: AppLogger,
  ) {}

  onModuleInit(): void {
    this.sweepTimer = setInterval(() => {
      void this.handleTimeoutSweep();
    }, 1_000);
  }

  onModuleDestroy(): void {
    if (this.sweepTimer) {
      clearInterval(this.sweepTimer);
    }
  }

  async bootstrapMatch(match: MatchDocument): Promise<RuntimeMatchState> {
    const startedAt = match.startedAt?.getTime() ?? Date.now();
    const state: RuntimeMatchState = {
      matchId: match._id.toString(),
      type: match.type,
      status: 'active',
      startNumber: match.startNumber,
      targetNumber: match.targetNumber,
      startedAt,
      expiresAt: startedAt + GAME_DURATION_MS,
      version: 0,
      winnerId: null,
      resultType: null,
      players: match.playerIds.map((playerId) => ({
        userId: playerId.toString(),
        currentValue: match.startNumber,
        storedElixir: 10,
        lastElixirUpdateAt: startedAt,
        connected: false,
        surrendered: false,
        lastAcceptedSeq: 0,
      })),
    };

    this.activeMatches.set(state.matchId, state);
    await this.persistState(state);
    return state;
  }

  async getMatchState(matchId: string): Promise<RuntimeMatchState | null> {
    const inMemory = this.activeMatches.get(matchId);
    if (inMemory) {
      return inMemory;
    }

    const raw = await this.redisService.client.get(this.redisKey(matchId));
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as RuntimeMatchState;
    this.activeMatches.set(matchId, parsed);
    return parsed;
  }

  async getActiveMatchByUser(userId: string): Promise<RuntimeMatchState | null> {
    for (const state of this.activeMatches.values()) {
      if (state.status === 'active' && state.players.some((player) => player.userId === userId)) {
        return state;
      }
    }

    return null;
  }

  async markConnected(matchId: string, userId: string, connected: boolean): Promise<RuntimeMatchState> {
    const state = await this.getMatchStateOrThrow(matchId);
    const player = state.players.find((entry) => entry.userId === userId);
    if (!player) {
      throw new NotFoundException('Player is not in this match');
    }

    player.connected = connected;
    state.version += 1;
    await this.persistState(state);
    return state;
  }

  async markDisconnectedForUser(userId: string): Promise<RuntimeMatchState[]> {
    const changed: RuntimeMatchState[] = [];

    for (const state of this.activeMatches.values()) {
      const player = state.players.find((entry) => entry.userId === userId);
      if (!player || state.status !== 'active') {
        continue;
      }

      player.connected = false;
      state.version += 1;
      changed.push(state);
      await this.persistState(state);
    }

    return changed;
  }

  async submitOperation(
    matchId: string,
    userId: string,
    payloadInput: unknown,
  ): Promise<RuntimeMatchState> {
    const payload = socketOperationSchema.parse(payloadInput);
    const state = await this.getMatchStateOrThrow(matchId);

    if (state.status !== 'active') {
      throw new BadRequestException('Match already finished');
    }

    if (Date.now() < state.startedAt) {
      throw new BadRequestException('Match has not started yet');
    }

    if (Date.now() >= state.expiresAt) {
      await this.finalizeByTimeout(state.matchId);
      throw new BadRequestException('Match time expired');
    }

    const player = state.players.find((entry) => entry.userId === userId);
    if (!player) {
      throw new NotFoundException('Player is not in this match');
    }

    if (payload.seq <= player.lastAcceptedSeq) {
      await this.matchesService.recordMove({
        matchId,
        userId,
        seq: payload.seq,
        operationType: payload.type,
        operand: payload.operand,
        cost: 0,
        beforeValue: player.currentValue,
        afterValue: player.currentValue,
        rejectedReason: 'STALE_SEQ',
      });
      throw new BadRequestException('Stale or duplicate sequence');
    }

    const before = BigInt(player.currentValue);

    try {
      const operation = parseOperation(payload.type, payload.operand, payload.seq);
      const cost = getOperationCost(operation.type, operation.operand);
      const nextElixir = spendElixir(
        player.storedElixir,
        player.lastElixirUpdateAt,
        cost,
        Date.now(),
      );
      const after = applyOperation(before, operation);

      player.currentValue = after.toString();
      player.storedElixir = nextElixir.storedElixir;
      player.lastElixirUpdateAt = nextElixir.lastElixirUpdateAt;
      player.lastAcceptedSeq = payload.seq;

      state.version += 1;

      await this.matchesService.recordMove({
        matchId,
        userId,
        seq: payload.seq,
        operationType: payload.type,
        operand: payload.operand,
        cost,
        beforeValue: before.toString(),
        afterValue: after.toString(),
      });

      if (after.toString() === state.targetNumber) {
        await this.finalizeExact(state.matchId, userId);
        const finished = await this.getMatchStateOrThrow(state.matchId);
        return finished;
      }

      await this.persistState(state);
      return state;
    } catch (error) {
      await this.matchesService.recordMove({
        matchId,
        userId,
        seq: payload.seq,
        operationType: payload.type,
        operand: payload.operand,
        cost: 0,
        beforeValue: before.toString(),
        afterValue: before.toString(),
        rejectedReason: (error as Error).message,
      });
      throw new BadRequestException((error as Error).message);
    }
  }

  async surrender(matchId: string, userId: string): Promise<RuntimeMatchState> {
    const state = await this.getMatchStateOrThrow(matchId);
    const player = state.players.find((entry) => entry.userId === userId);
    if (!player) {
      throw new NotFoundException('Player is not in this match');
    }

    if (state.status !== 'active') {
      return state;
    }

    player.surrendered = true;
    const winner = state.players.find((entry) => entry.userId !== userId);

    await this.finalizeState(state, winner?.userId ?? null, 'surrender');
    return (await this.getMatchState(matchId)) ?? state;
  }

  toClientState(state: RuntimeMatchState) {
    const dto = {
      matchId: state.matchId,
      startNumber: state.startNumber,
      targetNumber: state.targetNumber,
      serverNow: Date.now(),
      startedAt: state.startedAt,
      expiresAt: state.expiresAt,
      version: state.version,
      players: state.players,
    };

    return matchStateSchema.parse(dto);
  }

  private async handleTimeoutSweep(): Promise<void> {
    for (const state of this.activeMatches.values()) {
      if (state.status !== 'active') {
        continue;
      }

      if (Date.now() >= state.expiresAt) {
        await this.finalizeByTimeout(state.matchId);
      }
    }
  }

  private async finalizeExact(matchId: string, winnerId: string): Promise<void> {
    const state = await this.getMatchStateOrThrow(matchId);
    await this.finalizeState(state, winnerId, 'exact');
  }

  private async finalizeByTimeout(matchId: string): Promise<void> {
    const state = await this.getMatchStateOrThrow(matchId);
    const [playerA, playerB] = state.players;

    const resolution = resolveClosestWinner({
      target: state.targetNumber,
      playerAId: playerA.userId,
      playerBId: playerB.userId,
      playerAValue: playerA.currentValue,
      playerBValue: playerB.currentValue,
    });

    await this.finalizeState(
      state,
      resolution.winnerId,
      resolution.isDraw ? 'draw' : 'closest',
      resolution.distances,
    );
  }

  private async finalizeState(
    state: RuntimeMatchState,
    winnerId: string | null,
    resultType: 'exact' | 'closest' | 'surrender' | 'draw',
    distances?: Record<string, string>,
  ): Promise<void> {
    if (state.status === 'finished') {
      return;
    }

    if (this.finalizing.has(state.matchId)) {
      return;
    }

    this.finalizing.add(state.matchId);

    try {
      state.status = 'finished';
      state.winnerId = winnerId;
      state.resultType = resultType;
      state.version += 1;

      const finalDistances = distances ?? this.computeDistances(state);

      await this.matchesService.finalizeMatch({
        matchId: state.matchId,
        winnerId,
        resultType,
        finalDistances,
        playerStates: state.players,
      });

      await this.persistState(state);
      this.logger.event('match.runtime.finished', {
        matchId: state.matchId,
        winnerId,
        resultType,
      });
    } finally {
      this.finalizing.delete(state.matchId);
    }
  }

  private computeDistances(state: RuntimeMatchState): Record<string, string> {
    const target = BigInt(state.targetNumber);
    return Object.fromEntries(
      state.players.map((player) => {
        const current = BigInt(player.currentValue);
        const distance = target >= current ? target - current : current - target;
        return [player.userId, distance.toString()];
      }),
    );
  }

  private async getMatchStateOrThrow(matchId: string): Promise<RuntimeMatchState> {
    const state = await this.getMatchState(matchId);
    if (!state) {
      throw new NotFoundException('Runtime match state not found');
    }
    return state;
  }

  private redisKey(matchId: string): string {
    return `match:runtime:${matchId}`;
  }

  private async persistState(state: RuntimeMatchState): Promise<void> {
    this.activeMatches.set(state.matchId, state);
    await this.redisService.client.set(this.redisKey(state.matchId), JSON.stringify(state), 'EX', 60 * 60 * 24);
  }
}
