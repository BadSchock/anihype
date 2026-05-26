import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CommentPublicationStatus } from '@prisma/client';

class CommentAuthorDto {
  @ApiProperty() id!: number;
  @ApiProperty() username!: string;
  @ApiPropertyOptional() avatarUrl?: string | null;
}

export class CommentDto {
  @ApiProperty() id!: number;
  @ApiProperty() episodeId!: number;
  @ApiProperty({ type: CommentAuthorDto }) author!: CommentAuthorDto;
  @ApiPropertyOptional({ description: 'ID do comentário pai (null = raiz)' }) parentId?: number | null;
  @ApiProperty() content!: string;
  @ApiProperty() isSpoiler!: boolean;
  @ApiProperty({ enum: CommentPublicationStatus }) status!: CommentPublicationStatus;
  @ApiProperty({ description: 'Total de likes' }) likeCount!: number;
  @ApiProperty({ description: 'Total de replies' }) replyCount!: number;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
  @ApiPropertyOptional() editedAt?: Date | null;
}

export class CommentWithLikedDto extends CommentDto {
  @ApiProperty({ description: 'Se o usuário autenticado curtiu este comentário' })
  likedByMe!: boolean;
}
