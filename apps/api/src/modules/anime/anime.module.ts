import { Module, forwardRef } from '@nestjs/common';
import { AnimeController } from './anime.controller';
import { GenresController } from './genres.controller';
import { AnimeRepository } from './anime.repository';
import { AnimeService } from './anime.service';
import { RankingModule } from '../ranking/ranking.module';
import { SyncModule } from '../sync/sync.module';

@Module({
  imports: [RankingModule, forwardRef(() => SyncModule)],
  controllers: [AnimeController, GenresController],
  providers: [AnimeService, AnimeRepository],
  exports: [AnimeService, AnimeRepository],
})
export class AnimeModule {}
