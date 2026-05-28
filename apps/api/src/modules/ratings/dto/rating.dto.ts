import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateRatingDto {
  @ApiProperty({ minimum: 1, maximum: 10, description: 'Qualidade visual e direção de arte' })
  @IsInt() @Min(1) @Max(10)
  animation!: number;

  @ApiProperty({ minimum: 1, maximum: 10, description: 'História, ritmo e coerência' })
  @IsInt() @Min(1) @Max(10)
  story!: number;

  @ApiProperty({ minimum: 1, maximum: 10, description: 'Desenvolvimento e carisma dos personagens' })
  @IsInt() @Min(1) @Max(10)
  characters!: number;

  @ApiProperty({ minimum: 1, maximum: 10, description: 'OST, abertura, encerramento, vozes e ambientação' })
  @IsInt() @Min(1) @Max(10)
  sound!: number;

  @ApiProperty({ minimum: 1, maximum: 10, description: 'Diversão, vício, emoção e vontade de continuar' })
  @IsInt() @Min(1) @Max(10)
  hype!: number;

  @ApiPropertyOptional({ description: 'Texto livre da review (até 3000 caracteres)' })
  @IsOptional()
  @IsString()
  @MaxLength(3000)
  reviewText?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  containsSpoiler?: boolean;
}
