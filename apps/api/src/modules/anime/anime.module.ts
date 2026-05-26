import { Module } from '@nestjs/common';
import { AnimeController } from './anime.controller';
import { AnimeRepository } from './anime.repository';
import { AnimeService } from './anime.service';

@Module({
  controllers: [AnimeController],
  providers: [AnimeService, AnimeRepository],
  exports: [AnimeService, AnimeRepository],
})
export class AnimeModule {}
