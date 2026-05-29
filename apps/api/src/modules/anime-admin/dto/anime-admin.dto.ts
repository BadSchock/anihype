import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class StreamingLinkInputDto {
  @ApiProperty({ example: 'Crunchyroll' })
  @IsString()
  @MaxLength(255)
  platformName!: string;

  @ApiProperty({ example: 'https://www.crunchyroll.com/series/...' })
  @IsUrl({ require_protocol: true })
  @MaxLength(1000)
  url!: string;

  @ApiPropertyOptional({ example: 'BR' })
  @IsOptional()
  @IsString()
  @MaxLength(8)
  regionCode?: string;
}

export class UpdateAnimeAdminDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  coverImageUrl?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bannerImageUrl?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  trailerUrl?: string | null;

  @ApiPropertyOptional({ description: 'Quando true, sync não sobrescreve imagens/links manuais' })
  @IsOptional()
  @IsBoolean()
  isLocked?: boolean;

  @ApiPropertyOptional({ type: [StreamingLinkInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StreamingLinkInputDto)
  streamingLinks?: StreamingLinkInputDto[];
}

export class UpdateEpisodeAdminDto {
  @ApiPropertyOptional({ description: 'ISO 8601 — horário de exibição UTC' })
  @IsOptional()
  @IsString()
  airTimeUtc?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  title?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  thumbnailUrl?: string | null;
}
