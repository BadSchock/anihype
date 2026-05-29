import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators';
import { RatingsService } from './ratings.service';

@ApiTags('Ratings')
@Controller('ratings')
export class FeaturedRatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Public()
  @Get('featured')
  @ApiOperation({ summary: 'Review em destaque para a home' })
  getFeatured() {
    return this.ratingsService.getFeaturedReview();
  }
}
