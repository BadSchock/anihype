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
