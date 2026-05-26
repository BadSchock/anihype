import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EpisodeStatus } from '@prisma/client';

export class EpisodeDto {
  @ApiProperty() id!: number;
  @ApiProperty() animeId!: number;
  @ApiProperty() slug!: string;
  @ApiProperty() number!: number;
  @ApiPropertyOptional() title?: string | null;
  @ApiPropertyOptional() synopsis?: string | null;
  @ApiPropertyOptional() thumbnailUrl?: string | null;
  @ApiPropertyOptional() airDate?: Date | null;
  @ApiPropertyOptional() airTimeUtc?: Date | null;
  @ApiPropertyOptional() durationMinutes?: number | null;
  @ApiProperty({ enum: EpisodeStatus }) status!: EpisodeStatus;
  @ApiPropertyOptional() scoreAverage?: number | null;
  @ApiPropertyOptional() delayReason?: string | null;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

export class EpisodeWithAnimeDto extends EpisodeDto {
  @ApiProperty({
    description: 'Dados básicos do anime ao qual o episódio pertence',
    type: 'object',
    properties: {
      id: { type: 'number' },
      slug: { type: 'string' },
      titleRomaji: { type: 'string' },
      titleEnglish: { type: 'string', nullable: true },
      coverImageUrl: { type: 'string', nullable: true },
    },
  })
  anime!: {
    id: number;
    slug: string;
    titleRomaji: string;
    titleEnglish: string | null;
    coverImageUrl: string | null;
  };
}

export class CalendarDayDto {
  @ApiProperty({ description: 'Data no formato YYYY-MM-DD', example: '2024-01-15' })
  date!: string;

  @ApiProperty({ type: [EpisodeWithAnimeDto] })
  episodes!: EpisodeWithAnimeDto[];
}
