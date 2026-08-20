import { Module } from '@nestjs/common';
import { AnimeController } from './anime.controller';
import { GenresController } from './genres.controller';
import { AnimeRepository } from './anime.repository';
import { AnimeService } from './anime.service';

@Module({
  controllers: [AnimeController, GenresController],
  providers: [AnimeService, AnimeRepository],
  exports: [AnimeService, AnimeRepository],
})
export class AnimeModule {}
