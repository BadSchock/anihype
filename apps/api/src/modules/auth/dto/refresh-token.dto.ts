import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsInt, IsPositive } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({ description: 'ID do usuário' })
  @IsInt()
  @IsPositive()
  userId: number = 0;

  @ApiProperty({ description: 'Refresh token opaco recebido no login/register' })
  @IsString()
  @IsNotEmpty()
  refreshToken: string = '';
}
