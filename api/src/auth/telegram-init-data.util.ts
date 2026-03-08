import crypto from 'node:crypto';

export interface TelegramValidatedUser {
  id: string;
  username?: string;
  first_name: string;
  last_name?: string;
}

function timingSafeHexEqual(a: string, b: string): boolean {
  const aBuffer = Buffer.from(a, 'hex');
  const bBuffer = Buffer.from(b, 'hex');
  if (aBuffer.length !== bBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

export function validateTelegramInitData(
  initData: string,
  botToken: string,
  maxAgeSec: number,
): TelegramValidatedUser {
  const searchParams = new URLSearchParams(initData);
  const hash = searchParams.get('hash');
  const authDateRaw = searchParams.get('auth_date');
  const userRaw = searchParams.get('user');

  if (!hash || !authDateRaw || !userRaw) {
    throw new Error('Missing required Telegram init data fields');
  }

  const authDate = Number(authDateRaw);
  if (!Number.isFinite(authDate)) {
    throw new Error('Invalid auth_date in init data');
  }

  const nowSec = Math.floor(Date.now() / 1000);
  if (nowSec - authDate > maxAgeSec) {
    throw new Error('Telegram init data expired');
  }

  const dataCheckString = [...searchParams.entries()]
    .filter(([key]) => key !== 'hash')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const expectedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  if (!timingSafeHexEqual(expectedHash, hash)) {
    throw new Error('Telegram init data hash mismatch');
  }

  const parsedUser = JSON.parse(userRaw) as TelegramValidatedUser;
  if (!parsedUser.id || !parsedUser.first_name) {
    throw new Error('Invalid Telegram user payload');
  }

  return parsedUser;
}
