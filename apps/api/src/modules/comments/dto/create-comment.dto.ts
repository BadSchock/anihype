import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ description: 'ID do episódio em que o comentário será feito' })
  @IsInt()
  @Min(1)
  episodeId!: number;

  @ApiProperty({ description: 'Conteúdo do comentário', maxLength: 5000 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  content!: string;

  @ApiPropertyOptional({ description: 'ID do comentário pai (para replies)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  parentId?: number;

  @ApiPropertyOptional({ description: 'Marca como spoiler', default: false })
  @IsOptional()
  @IsBoolean()
  isSpoiler?: boolean = false;
}
