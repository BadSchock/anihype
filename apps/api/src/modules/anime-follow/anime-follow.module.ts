import { Module } from '@nestjs/common';
import { AnimeFollowController } from './anime-follow.controller';
import { AnimeFollowService } from './anime-follow.service';

@Module({
  controllers: [AnimeFollowController],
  providers: [AnimeFollowService],
})
export class AnimeFollowModule {}
