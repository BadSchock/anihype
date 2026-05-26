import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'user@example.com', description: 'Email ou username' })
  @IsString()
  @MaxLength(320)
  identifier: string = '';

  @ApiProperty({ example: 'MinhaS3nh4!' })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  password: string = '';
}
