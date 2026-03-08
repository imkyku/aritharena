import { FriendMatchesService } from './friend-matches.service.js';

describe('FriendMatchesService', () => {
  const storage = new Map<string, string>();

  const redis = {
    set: jest.fn(async (key: string, value: string) => {
      if (storage.has(key)) return null;
      storage.set(key, value);
      return 'OK';
    }),
    get: jest.fn(async (key: string) => storage.get(key) ?? null),
    del: jest.fn(async (key: string) => {
      storage.delete(key);
      return 1;
    }),
  };

  let service: FriendMatchesService;

  beforeEach(() => {
    storage.clear();
    jest.clearAllMocks();
    service = new FriendMatchesService({ client: redis } as never);
  });

  it('creates and consumes invite code', async () => {
    const created = await service.createInvite('host-user');
    expect(created.code).toHaveLength(6);

    const consumed = await service.consumeInvite(created.code, 'joiner-user');
    expect(consumed.hostUserId).toBe('host-user');
    expect(consumed.joinerUserId).toBe('joiner-user');
  });
});
