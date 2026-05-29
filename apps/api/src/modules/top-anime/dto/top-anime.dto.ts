import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsPositive,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class TopAnimeItemDto {
  @ApiProperty({ description: 'ID do anime', minimum: 1 })
  @IsInt()
  @IsPositive()
  animeId!: number;

  @ApiProperty({ description: 'Posição no Top 4 (1–4)', minimum: 1, maximum: 4 })
  @IsInt()
  @IsPositive()
  position!: number;
}

export class SetTopAnimeDto {
  @ApiProperty({
    type: [TopAnimeItemDto],
    description: 'Lista de até 4 animes favoritos',
  })
  @IsArray()
  @ArrayMinSize(0)
  @ArrayMaxSize(4)
  @ValidateNested({ each: true })
  @Type(() => TopAnimeItemDto)
  items!: TopAnimeItemDto[];
}
