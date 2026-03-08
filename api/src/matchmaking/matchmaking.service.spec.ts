import { MatchmakingService } from './matchmaking.service.js';

describe('MatchmakingService', () => {
  const zset = new Map<string, number>();
  const hash = new Map<string, Record<string, string>>();
  const kv = new Map<string, string>();

  const redis = {
    zadd: jest.fn(async (_key: string, score: number, member: string) => {
      zset.set(member, score);
      return 1;
    }),
    hset: jest.fn(async (key: string, values: Record<string, string | number>) => {
      hash.set(
        key,
        Object.fromEntries(Object.entries(values).map(([k, v]) => [k, String(v)])),
      );
      return 1;
    }),
    expire: jest.fn(async () => 1),
    zrem: jest.fn(async (_key: string, ...members: string[]) => {
      let removed = 0;
      for (const member of members) {
        if (zset.delete(member)) removed += 1;
      }
      return removed;
    }),
    del: jest.fn(async (...keys: string[]) => {
      for (const key of keys) {
        hash.delete(key);
        kv.delete(key);
      }
      return 1;
    }),
    hgetall: jest.fn(async (key: string) => hash.get(key) ?? {}),
    zrangebyscore: jest.fn(async (_key: string, min: number, max: number) => {
      return [...zset.entries()]
        .filter(([, score]) => score >= min && score <= max)
        .map(([member]) => member);
    }),
    set: jest.fn(async (key: string, value: string) => {
      if (kv.has(key)) return null;
      kv.set(key, value);
      return 'OK';
    }),
  };

  const metadataModel = {
    updateOne: jest.fn(async () => undefined),
    deleteOne: jest.fn(async () => undefined),
    deleteMany: jest.fn(async () => undefined),
  };

  let service: MatchmakingService;

  beforeEach(() => {
    zset.clear();
    hash.clear();
    kv.clear();
    jest.clearAllMocks();
    service = new MatchmakingService(
      { client: redis } as never,
      metadataModel as never,
    );
  });

  it('matches two queued players in range', async () => {
    await service.joinRankedQueue('a', 1000);
    await service.joinRankedQueue('b', 1050);

    const pair = await service.tryMatch('a');
    expect(pair).toEqual({ userA: 'a', userB: 'b' });
  });
});
