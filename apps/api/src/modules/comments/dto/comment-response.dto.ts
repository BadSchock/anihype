import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CommentPublicationStatus } from '@prisma/client';

class EquippedBadgeDto {
  @ApiProperty() id!: number;
  @ApiProperty() slug!: string;
  @ApiProperty() name!: string;
  @ApiPropertyOptional() rarityColor?: string | null;
  @ApiPropertyOptional() iconUrl?: string | null;
}

class CommentAuthorDto {
  @ApiProperty() id!: number;
  @ApiProperty() username!: string;
  @ApiPropertyOptional() avatarUrl?: string | null;
  @ApiPropertyOptional({ type: EquippedBadgeDto, nullable: true })
  equippedBadge?: EquippedBadgeDto | null;
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
  @ApiPropertyOptional({ description: 'Conquistas desbloqueadas nesta ação' })
  awardedBadges?: Array<{ slug: string; name: string; rarityColor: string | null }>;
}

export class CommentWithLikedDto extends CommentDto {
  @ApiProperty({ description: 'Se o usuário autenticado curtiu este comentário' })
  likedByMe!: boolean;
}

export class HotCommentEpisodeDto {
  @ApiProperty() id!: number;
  @ApiProperty() number!: number;
  @ApiPropertyOptional() title?: string | null;
  @ApiProperty() anime!: {
    id: number;
    slug: string;
    titleRomaji: string;
    titleEnglish: string | null;
    coverImageUrl: string | null;
  };
}

export class HotCommentDto extends CommentDto {
  @ApiProperty({ type: HotCommentEpisodeDto })
  episode!: HotCommentEpisodeDto;
}
