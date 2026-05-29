import { Module } from '@nestjs/common';
import { UserFollowModule } from '../user-follow/user-follow.module';
import { FeedController } from './feed.controller';
import { FeedService } from './feed.service';

@Module({
  imports: [UserFollowModule],
  controllers: [FeedController],
  providers: [FeedService],
  exports: [FeedService],
})
export class FeedModule {}
