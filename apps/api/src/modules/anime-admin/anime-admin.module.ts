import { Module } from '@nestjs/common';
import { AnimeAdminController } from './anime-admin.controller';
import { AnimeAdminService } from './anime-admin.service';

@Module({
  controllers: [AnimeAdminController],
  providers: [AnimeAdminService],
})
export class AnimeAdminModule {}
