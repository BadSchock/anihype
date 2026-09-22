import { Module } from '@nestjs/common';

import { UsersController } from './users.controller';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';
import { AvatarStorageService } from './avatar-storage.service';
import { RankingModule } from '../ranking/ranking.module';

@Module({
  imports: [RankingModule],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository, AvatarStorageService],
  exports: [UsersService],
})
export class UsersModule {}
