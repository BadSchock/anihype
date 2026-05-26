import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateCommentDto {
  @ApiPropertyOptional({ description: 'Novo conteúdo do comentário', maxLength: 5000 })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  content?: string;

  @ApiPropertyOptional({ description: 'Atualizar flag de spoiler' })
  @IsOptional()
  @IsBoolean()
  isSpoiler?: boolean;
}
