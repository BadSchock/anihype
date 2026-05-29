import { Module } from '@nestjs/common';
import { UserFollowController } from './user-follow.controller';
import { UserFollowService } from './user-follow.service';

@Module({
  controllers: [UserFollowController],
  providers: [UserFollowService],
  exports: [UserFollowService],
})
export class UserFollowModule {}
