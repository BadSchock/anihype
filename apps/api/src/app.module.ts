import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

import { appConfig, databaseConfig, jwtConfig, providersConfig, validateEnv } from './config';
import { PrismaModule } from './prisma/prisma.module';
import { GlobalExceptionFilter } from './common/filters';
import { TransformInterceptor } from './common/interceptors';
import { RolesGuard } from './common/guards/roles.guard';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { AnimeModule } from './modules/anime/anime.module';
import { EpisodesModule } from './modules/episodes/episodes.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      validate: validateEnv,
      load: [appConfig, databaseConfig, jwtConfig, providersConfig],
    }),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000,
        limit: 100,
      },
    ]),
    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
    AnimeModule,
    EpisodesModule,
  ],
  providers: [
    // Exception filter global
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    // Response envelope global
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    // Rate-limit global
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // JWT auth global (rotas @Public() ficam abertas)
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // Roles guard global
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
