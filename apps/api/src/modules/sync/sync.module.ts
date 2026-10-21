import { Module, forwardRef } from '@nestjs/common';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';
import { CronService } from './cron.service';
import { AniListModule } from '../providers/anilist/anilist.module';
import { JikanModule } from '../providers/jikan/jikan.module';
import { AnimeModule } from '../anime/anime.module';

@Module({
  imports: [AniListModule, JikanModule, forwardRef(() => AnimeModule)],
  controllers: [SyncController],
  providers: [SyncService, CronService],
  exports: [SyncService],
})
export class SyncModule {}
