import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';

import {
  appConfig,
  avatarStorageConfig,
  databaseConfig,
  jwtConfig,
  mailConfig,
  providersConfig,
  validateEnv,
} from './config';
import { MailModule } from './modules/mail/mail.module';
import { PrismaModule } from './prisma/prisma.module';
import { GlobalExceptionFilter } from './common/filters';
import { TransformInterceptor } from './common/interceptors';
import { RolesGuard } from './common/guards/roles.guard';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { AnimeModule } from './modules/anime/anime.module';
import { EpisodesModule } from './modules/episodes/episodes.module';
import { CommentsModule } from './modules/comments/comments.module';
import { SyncModule } from './modules/sync/sync.module';
import { RatingsModule } from './modules/ratings/ratings.module';
import { HighlightsModule } from './modules/highlights/highlights.module';
import { TopAnimeModule } from './modules/top-anime/top-anime.module';
import { AnimeFollowModule } from './modules/anime-follow/anime-follow.module';
import { HypeModule } from './modules/hype/hype.module';
import { AnimeAdminModule } from './modules/anime-admin/anime-admin.module';
import { UserFollowModule } from './modules/user-follow/user-follow.module';
import { FeedModule } from './modules/feed/feed.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { BadgesModule } from './modules/badges/badges.module';
import { RankingModule } from './modules/ranking/ranking.module';
import { TranslateModule } from './modules/translate/translate.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      validate: validateEnv,
      load: [appConfig, databaseConfig, jwtConfig, providersConfig, avatarStorageConfig, mailConfig],
    }),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000,
        limit: 100,
      },
    ]),
    ScheduleModule.forRoot(),
    PrismaModule,
    MailModule,
    HealthModule,
    AuthModule,
    UsersModule,
    AnimeModule,
    EpisodesModule,
    CommentsModule,
    SyncModule,
    RatingsModule,
    HighlightsModule,
    TopAnimeModule,
    AnimeFollowModule,
    BadgesModule,
    HypeModule,
    AnimeAdminModule,
    UserFollowModule,
    FeedModule,
    NotificationsModule,
    RankingModule,
    TranslateModule,
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
