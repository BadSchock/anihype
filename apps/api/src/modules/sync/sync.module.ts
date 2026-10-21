import { Module, forwardRef } from '@nestjs/common';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';
import { CronService } from './cron.service';
import { AniListModule } from '../providers/anilist/anilist.module';
import { JikanModule } from '../providers/jikan/jikan.module';
import { AnimeModule } from '../anime/anime.module';
import { TranslateModule } from '../translate/translate.module';

@Module({
  imports: [AniListModule, JikanModule, TranslateModule, forwardRef(() => AnimeModule)],
  controllers: [SyncController],
  providers: [SyncService, CronService],
  exports: [SyncService],
})
export class SyncModule {}
