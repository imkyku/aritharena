import { apiClient } from '../../lib/api';
import { z } from 'zod';

const authResponseSchema = z.object({
  accessToken: z.string(),
  user: z.object({
    id: z.string(),
    telegramId: z.string(),
    username: z.string().nullable(),
    firstName: z.string(),
    lastName: z.string().nullable(),
    locale: z.enum(['ru', 'en']),
    rating: z.number(),
    gamesPlayed: z.number(),
  }),
});

export async function authWithTelegram(initData: string) {
  const { data } = await apiClient.post('/auth/telegram', { initData });
  return authResponseSchema.parse(data);
}
