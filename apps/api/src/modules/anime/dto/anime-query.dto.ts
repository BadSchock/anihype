import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { AnimeFormat, AnimeSeason, AnimeStatus } from '@prisma/client';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class AnimeQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Busca por título (romaji, inglês ou nativo)' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: AnimeStatus })
  @IsOptional()
  @IsEnum(AnimeStatus)
  status?: AnimeStatus;

  @ApiPropertyOptional({ enum: AnimeFormat })
  @IsOptional()
  @IsEnum(AnimeFormat)
  format?: AnimeFormat;

  @ApiPropertyOptional({ enum: AnimeSeason })
  @IsOptional()
  @IsEnum(AnimeSeason)
  season?: AnimeSeason;

  @ApiPropertyOptional({ description: 'Ano da temporada', example: 2024 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1960)
  @Max(2100)
  seasonYear?: number;

  @ApiPropertyOptional({ description: 'ID de gênero para filtrar (legado; um único id)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  genreId?: number;

  @ApiPropertyOptional({
    description: 'CSV de slugs de gênero (AND). Ex: acao,romance',
    example: 'action,romance',
  })
  @IsOptional()
  @IsString()
  genre?: string;

  @ApiPropertyOptional({
    description: 'CSV de IDs de gênero (AND). Ex: 1,2,3',
    example: '1,2',
  })
  @IsOptional()
  @IsString()
  genreIds?: string;

  @ApiPropertyOptional({ description: 'Ordernar por: popular | score | recent | title', default: 'popular' })
  @IsOptional()
  @IsString()
  orderBy?: 'popular' | 'score' | 'recent' | 'title' | 'rating';
}
