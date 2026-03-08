import crypto from 'node:crypto';
import { validateTelegramInitData } from './telegram-init-data.util.js';

function signInitData(params: Record<string, string>, botToken: string): string {
  const search = new URLSearchParams(params);
  const dataCheckString = [...search.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const hash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
  search.set('hash', hash);
  return search.toString();
}

describe('validateTelegramInitData', () => {
  const botToken = '123456789:abcdefghijklmnopqrstuvwxyz123456';

  it('accepts valid signed init data', () => {
    const now = Math.floor(Date.now() / 1000);
    const user = {
      id: '42',
      first_name: 'Test',
      last_name: 'User',
      username: 'test',
    };

    const initData = signInitData(
      {
        auth_date: String(now),
        query_id: 'AAEAAQ',
        user: JSON.stringify(user),
      },
      botToken,
    );

    const validated = validateTelegramInitData(initData, botToken, 300);
    expect(validated.id).toBe('42');
  });

  it('rejects expired init data', () => {
    const old = Math.floor(Date.now() / 1000) - 10_000;
    const initData = signInitData(
      {
        auth_date: String(old),
        query_id: 'AAEAAQ',
        user: JSON.stringify({ id: '42', first_name: 'Old' }),
      },
      botToken,
    );

    expect(() => validateTelegramInitData(initData, botToken, 300)).toThrow(/expired/i);
  });
});
