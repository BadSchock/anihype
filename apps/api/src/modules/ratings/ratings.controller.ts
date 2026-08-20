import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators';
import { RatingsService } from './ratings.service';
import { CreateRatingDto } from './dto/rating.dto';

@ApiTags('Ratings')
@ApiBearerAuth()
@Controller('anime/:slug/ratings')
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Criar ou atualizar minha avaliação do anime' })
  upsert(
    @Param('slug') slug: string,
    @CurrentUser('id') userId: number,
    @Body() dto: CreateRatingDto,
  ) {
    return this.ratingsService.upsertRating(userId, slug, dto);
  }

  @Get('me')
  @ApiOperation({ summary: 'Obter minha avaliação deste anime' })
  getMyRating(
    @Param('slug') slug: string,
    @CurrentUser('id') userId: number,
  ) {
    return this.ratingsService.getMyRating(userId, slug);
  }

  @Delete('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remover minha avaliação (soft delete)' })
  deleteMyRating(
    @Param('slug') slug: string,
    @CurrentUser('id') userId: number,
  ) {
    return this.ratingsService.deleteMyRating(userId, slug);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Listar reviews e agregado do Hypômetro para este anime' })
  getAnimeRatings(
    @Param('slug') slug: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sort') sort?: string,
  ) {
    return this.ratingsService.getAnimeRatings(
      slug,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      sort ?? 'recent',
    );
  }
}
