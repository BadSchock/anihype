import { Module } from '@nestjs/common';
import { TopAnimeController } from './top-anime.controller';
import { TopAnimeService } from './top-anime.service';

@Module({
  controllers: [TopAnimeController],
  providers: [TopAnimeService],
})
export class TopAnimeModule {}
