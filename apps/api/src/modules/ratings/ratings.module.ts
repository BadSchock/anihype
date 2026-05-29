import { Module } from '@nestjs/common';
import { RatingsController } from './ratings.controller';
import { FeaturedRatingsController } from './featured-ratings.controller';
import { RatingsService } from './ratings.service';

@Module({
  controllers: [RatingsController, FeaturedRatingsController],
  providers: [RatingsService],
  exports: [RatingsService],
})
export class RatingsModule {}
