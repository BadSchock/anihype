import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  nodeEnv: process.env['NODE_ENV'] ?? 'development',
  port: parseInt(process.env['PORT'] ?? '3001', 10),
  corsOrigin: process.env['CORS_ORIGIN'] ?? 'http://localhost:3002',
  isProduction: process.env['NODE_ENV'] === 'production',
  isDevelopment: process.env['NODE_ENV'] === 'development',
}));

export const databaseConfig = registerAs('database', () => ({
  url: process.env['DATABASE_URL'],
}));

export const jwtConfig = registerAs('jwt', () => ({
  secret: process.env['JWT_SECRET'],
  expiresIn: process.env['JWT_EXPIRES_IN'] ?? '15m',
  refreshSecret: process.env['REFRESH_TOKEN_SECRET'],
  refreshExpiresIn: process.env['REFRESH_TOKEN_EXPIRES_IN'] ?? '7d',
}));

export const providersConfig = registerAs('providers', () => ({
  anilistApiUrl: process.env['ANILIST_API_URL'] ?? 'https://graphql.anilist.co',
  jikanApiUrl: process.env['JIKAN_API_URL'] ?? 'https://api.jikan.moe/v4',
}));

/** E-mail transacional via SMTP. Sem host configurado, o MailService só registra o link no log. */
export const mailConfig = registerAs('mail', () => {
  const firstCors = (process.env['CORS_ORIGIN'] ?? 'http://localhost:3002').split(',')[0]?.trim();
  return {
    webUrl: (process.env['WEB_URL'] ?? firstCors ?? 'http://localhost:3002').replace(/\/+$/, ''),
    host: process.env['SMTP_HOST'],
    port: parseInt(process.env['SMTP_PORT'] ?? '587', 10),
    secure: process.env['SMTP_SECURE'] === 'true',
    user: process.env['SMTP_USER'],
    pass: process.env['SMTP_PASS'],
    from: process.env['MAIL_FROM'] ?? 'AniHype <nao-responda@anihype.com.br>',
  };
});

/**
 * Avatar no disco da API. AVATAR_PUBLIC_URL é o endereço que o navegador
 * usa para abrir a imagem (em produção, a URL pública da API + /uploads).
 */
export const avatarStorageConfig = registerAs('avatarStorage', () => {
  const port = process.env['PORT'] ?? '3001';
  return {
    uploadDir: process.env['AVATAR_UPLOAD_DIR'],
    publicUrl: process.env['AVATAR_PUBLIC_URL'] ?? `http://localhost:${port}/uploads`,
  };
});
