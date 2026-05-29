import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AnimeSeason } from '@prisma/client';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateHighlightDto {
  @ApiProperty({ description: 'ID do anime no banco' })
  @IsInt()
  @Min(1)
  animeId!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  subtitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ example: 'Ver anime' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  ctaLabel?: string;

  @ApiPropertyOptional({ example: '/anime/frieren' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  destination?: string;

  @ApiPropertyOptional({ enum: AnimeSeason })
  @IsOptional()
  @IsEnum(AnimeSeason)
  season?: AnimeSeason;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  year?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  heroPosition?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  published?: boolean;
}

export class UpdateHighlightDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  subtitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  ctaLabel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  destination?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  heroPosition?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  published?: boolean;
}
