import { Module } from '@nestjs/common';
import { EpisodesController, AnimeEpisodesController } from './episodes.controller';
import { EpisodesRepository } from './episodes.repository';
import { EpisodesService } from './episodes.service';

@Module({
  controllers: [EpisodesController, AnimeEpisodesController],
  providers: [EpisodesService, EpisodesRepository],
  exports: [EpisodesService, EpisodesRepository],
})
export class EpisodesModule {}
