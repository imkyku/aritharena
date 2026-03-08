import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  FRONTEND_URL: z.string().min(1),
  MONGO_URI: z.string().min(1),
  REDIS_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),
  TELEGRAM_BOT_TOKEN: z.string().min(20),
  TELEGRAM_INIT_MAX_AGE_SEC: z.coerce.number().int().positive().default(300),
  ALLOW_DEV_TELEGRAM_BYPASS: z.coerce.boolean().default(false),
  ADMIN_API_KEY: z.string().min(20),
  RATE_LIMIT_TTL_SEC: z.coerce.number().int().positive().default(60),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(120),
});

export type AppEnv = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): AppEnv {
  return envSchema.parse(config);
}
