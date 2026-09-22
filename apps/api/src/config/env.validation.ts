import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().positive().default(3001),

  DATABASE_URL: z.string().url({ message: 'DATABASE_URL must be a valid URL' }),

  JWT_SECRET: z.string().min(16, { message: 'JWT_SECRET must be at least 16 characters' }),
  JWT_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_SECRET: z
    .string()
    .min(16, { message: 'REFRESH_TOKEN_SECRET must be at least 16 characters' }),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('7d'),

  CORS_ORIGIN: z.string().default('http://localhost:3002'),

  ANILIST_API_URL: z.string().url().default('https://graphql.anilist.co'),
  JIKAN_API_URL: z.string().url().default('https://api.jikan.moe/v4'),

  // Cloudflare R2 (avatar upload) — opcionais; sem elas, upload de avatar fica indisponível (503)
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET: z.string().optional(),
  R2_PUBLIC_URL: z.string().url().optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    const errors = result.error.errors
      .map((e) => `  - ${e.path.join('.')}: ${e.message}`)
      .join('\n');

    throw new Error(`Invalid environment variables:\n${errors}`);
  }

  return result.data;
}
