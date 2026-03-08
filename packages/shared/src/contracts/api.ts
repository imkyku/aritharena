import { z } from 'zod';

const bigIntStr = z.string().regex(/^\d+$/);

export const telegramAuthRequestSchema = z.object({
  initData: z.string().min(1),
});

export const meResponseSchema = z.object({
  id: z.string(),
  telegramId: z.string(),
  username: z.string().nullable(),
  firstName: z.string(),
  lastName: z.string().nullable(),
  rating: z.number().int(),
  gamesPlayed: z.number().int(),
  locale: z.enum(['ru', 'en']),
});

export const matchStateSchema = z.object({
  matchId: z.string(),
  targetNumber: bigIntStr,
  startNumber: bigIntStr,
  serverNow: z.number().int(),
  startedAt: z.number().int(),
  expiresAt: z.number().int(),
  version: z.number().int().nonnegative(),
  players: z.array(
    z.object({
      userId: z.string(),
      currentValue: bigIntStr,
      storedElixir: z.number().int().min(0).max(10),
      lastElixirUpdateAt: z.number().int(),
      connected: z.boolean(),
      surrendered: z.boolean(),
      lastAcceptedSeq: z.number().int().nonnegative(),
    }),
  ),
});

export type MatchStateDto = z.infer<typeof matchStateSchema>;
