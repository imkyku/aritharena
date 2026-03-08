import { z } from 'zod';

export const operationTypeSchema = z.enum(['add', 'sub', 'mul', 'div']);

export const socketOperationSchema = z.object({
  matchId: z.string().min(1),
  seq: z.number().int().positive(),
  type: operationTypeSchema,
  operand: z.string().regex(/^\d+$/),
  clientSentAt: z.number().int().positive(),
});

export const matchmakingJoinSchema = z.object({
  mode: z.enum(['ranked']).default('ranked'),
});

export const friendCreateSchema = z.object({
  bestOf: z.number().int().min(1).max(3).default(1),
});

export const friendJoinSchema = z.object({
  code: z.string().trim().min(4).max(12),
});

export type SocketOperationPayload = z.infer<typeof socketOperationSchema>;
