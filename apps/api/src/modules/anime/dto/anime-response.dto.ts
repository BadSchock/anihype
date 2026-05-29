import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AnimeFormat, AnimeSeason, AnimeStatus } from '@prisma/client';

export class GenreDto {
  @ApiProperty() id!: number;
  @ApiProperty() name!: string;
  @ApiProperty() slug!: string;
}

export class StudioDto {
  @ApiProperty() id!: number;
  @ApiProperty() name!: string;
  @ApiPropertyOptional() role?: string | null;
}

export class StreamingPlatformDto {
  @ApiProperty() id!: number;
  @ApiProperty() name!: string;
  @ApiProperty() slug!: string;
  @ApiPropertyOptional() homepageUrl?: string | null;
}

export class StreamingLinkDto {
  @ApiProperty() id!: number;
  @ApiProperty() url!: string;
  @ApiPropertyOptional() regionCode?: string | null;
  @ApiProperty({ type: StreamingPlatformDto }) platform!: StreamingPlatformDto;
}

export class AnimeListItemDto {
  @ApiProperty() id!: number;
  @ApiProperty() slug!: string;
  @ApiProperty() titleRomaji!: string;
  @ApiPropertyOptional() titleEnglish?: string | null;
  @ApiPropertyOptional() titleNative?: string | null;
  @ApiPropertyOptional() synopsis?: string | null;
  @ApiPropertyOptional() coverImageUrl?: string | null;
  @ApiPropertyOptional() bannerImageUrl?: string | null;
  @ApiProperty({ enum: AnimeStatus }) status!: AnimeStatus;
  @ApiPropertyOptional({ enum: AnimeFormat }) format?: AnimeFormat | null;
  @ApiPropertyOptional({ enum: AnimeSeason }) season?: AnimeSeason | null;
  @ApiPropertyOptional() seasonYear?: number | null;
  @ApiPropertyOptional() episodeCount?: number | null;
  @ApiPropertyOptional() averageScore?: number | null;
  @ApiPropertyOptional() popularityScore?: number | null;
  @ApiProperty({ type: [GenreDto] }) genres!: GenreDto[];
  @ApiProperty({ type: [StudioDto] }) studios!: StudioDto[];
  // Scores da comunidade AniHype
  @ApiProperty() ratingCount!: number;
  @ApiPropertyOptional() ratingAverage?: number | null;
  @ApiPropertyOptional() ratingAnimation?: number | null;
  @ApiPropertyOptional() ratingStory?: number | null;
  @ApiPropertyOptional() ratingCharacters?: number | null;
  @ApiPropertyOptional() ratingSound?: number | null;
  @ApiPropertyOptional() ratingHype?: number | null;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

export class AnimeDetailDto extends AnimeListItemDto {
  @ApiPropertyOptional() trailerUrl?: string | null;
  @ApiPropertyOptional() episodeDuration?: number | null;
  @ApiProperty() isAdult!: boolean;
  @ApiProperty({ type: [StreamingLinkDto] }) streamingLinks!: StreamingLinkDto[];
}
