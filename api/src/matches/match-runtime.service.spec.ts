import { Types } from 'mongoose';
import { MatchRuntimeService } from './match-runtime.service.js';

describe('MatchRuntimeService lifecycle', () => {
  const redisStorage = new Map<string, string>();
  const redis = {
    get: jest.fn(async (key: string) => redisStorage.get(key) ?? null),
    set: jest.fn(async (key: string, value: string) => {
      redisStorage.set(key, value);
      return 'OK';
    }),
  };

  const matchesService = {
    recordMove: jest.fn(async () => undefined),
    finalizeMatch: jest.fn(async () => undefined),
  };

  const logger = {
    event: jest.fn(),
  };

  let runtime: MatchRuntimeService;

  beforeEach(() => {
    jest.clearAllMocks();
    redisStorage.clear();
    runtime = new MatchRuntimeService(
      matchesService as never,
      { client: redis } as never,
      logger as never,
    );
  });

  it('handles operation and reconnect flow', async () => {
    const userA = new Types.ObjectId();
    const userB = new Types.ObjectId();

    const match = {
      _id: new Types.ObjectId(),
      type: 'ranked',
      startNumber: '100',
      targetNumber: '120',
      startedAt: new Date(Date.now() - 1_000),
      playerIds: [userA, userB],
    };

    const state = await runtime.bootstrapMatch(match as never);
    await runtime.markConnected(state.matchId, userA.toString(), true);

    const updated = await runtime.submitOperation(state.matchId, userA.toString(), {
      matchId: state.matchId,
      seq: 1,
      type: 'add',
      operand: '20',
      clientSentAt: Date.now(),
    });

    const playerA = updated.players.find((player) => player.userId === userA.toString());
    expect(playerA?.currentValue).toBe('120');

    const disconnected = await runtime.markDisconnectedForUser(userA.toString());
    expect(disconnected.length).toBeGreaterThanOrEqual(1);

    await runtime.markConnected(state.matchId, userA.toString(), true);
    expect(matchesService.recordMove).toHaveBeenCalled();
  });
});
