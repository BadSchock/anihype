import { Module } from '@nestjs/common';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';
import { AniListModule } from '../providers/anilist/anilist.module';
import { JikanModule } from '../providers/jikan/jikan.module';
import { AnimeModule } from '../anime/anime.module';

@Module({
  imports: [AniListModule, JikanModule, AnimeModule],
  controllers: [SyncController],
  providers: [SyncService],
  exports: [SyncService],
})
export class SyncModule {}
