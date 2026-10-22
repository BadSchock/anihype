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

  // Pasta local de avatares. Sem AVATAR_PUBLIC_URL, o padrão é http://localhost:PORT/uploads.
  AVATAR_UPLOAD_DIR: z.string().optional(),
  AVATAR_PUBLIC_URL: z.string().url().optional(),

  // Endereço público do site, usado nos links dos e-mails (redefinir senha, verificar e-mail).
  WEB_URL: z.string().url().optional(),

  // E-mail transacional. Sem SMTP_HOST, os links aparecem só no log da API.
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().positive().default(587),
  SMTP_SECURE: z.enum(['true', 'false']).default('false'),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  MAIL_FROM: z.string().default('AniHype <nao-responda@anihype.com.br>'),

  // Importa a temporada atual quando a API sobe e ela está vazia. Use false para desligar.
  SYNC_ON_BOOT: z.enum(['true', 'false']).default('true'),
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
