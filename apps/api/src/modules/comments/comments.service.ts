import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CommentsRepository, CommentWithMeta } from './comments.repository';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CommentQueryDto } from './dto/comment-query.dto';
import { CommentDto, CommentWithLikedDto } from './dto/comment-response.dto';
import { PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class CommentsService {
  constructor(private readonly repo: CommentsRepository) {}

  async findByEpisode(
    episodeId: number,
    query: CommentQueryDto,
    currentUserId?: number,
  ): Promise<PaginatedResult<CommentWithLikedDto>> {
    const result = await this.repo.findByEpisode(episodeId, query);

    const dtos = await Promise.all(
      result.data.map((c) => this.toDtoWithLiked(c, currentUserId)),
    );

    return { data: dtos, meta: result.meta };
  }

  async findById(id: number, currentUserId?: number): Promise<CommentWithLikedDto> {
    const comment = await this.repo.findById(id);
    if (!comment) throw new NotFoundException(`Comentário ${id} não encontrado.`);
    return this.toDtoWithLiked(comment, currentUserId);
  }

  async create(dto: CreateCommentDto, userId: number): Promise<CommentDto> {
    const comment = await this.repo.create({
      episode: { connect: { id: dto.episodeId } },
      user: { connect: { id: userId } },
      content: dto.content,
      isSpoiler: dto.isSpoiler ?? false,
      ...(dto.parentId && { parent: { connect: { id: dto.parentId } } }),
    });
    return this.toDto(comment);
  }

  async update(id: number, dto: UpdateCommentDto, userId: number): Promise<CommentDto> {
    const comment = await this.findRaw(id);
    this.assertOwner(comment, userId);

    const updated = await this.repo.update(id, {
      ...(dto.content !== undefined && { content: dto.content }),
      ...(dto.isSpoiler !== undefined && { isSpoiler: dto.isSpoiler }),
      editedAt: new Date(),
    });

    return this.toDto(updated);
  }

  async remove(id: number, userId: number, isAdmin = false): Promise<void> {
    const comment = await this.findRaw(id);
    if (!isAdmin) this.assertOwner(comment, userId);
    await this.repo.softDelete(id);
  }

  // ---------------------------------------------------------------------------
  // Likes
  // ---------------------------------------------------------------------------

  async toggleLike(commentId: number, userId: number): Promise<{ liked: boolean; likeCount: number }> {
    await this.findRaw(commentId);

    const alreadyLiked = await this.repo.hasLiked(userId, commentId);
    if (alreadyLiked) {
      await this.repo.removeLike(userId, commentId);
    } else {
      await this.repo.addLike(userId, commentId);
    }

    const likeCount = await this.repo.getLikeCount(commentId);
    return { liked: !alreadyLiked, likeCount };
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private async findRaw(id: number): Promise<CommentWithMeta> {
    const comment = await this.repo.findById(id);
    if (!comment) throw new NotFoundException(`Comentário ${id} não encontrado.`);
    return comment;
  }

  private assertOwner(comment: CommentWithMeta, userId: number): void {
    if (comment.userId !== userId) {
      throw new ForbiddenException('Você não tem permissão para editar este comentário.');
    }
  }

  private toDto(c: CommentWithMeta): CommentDto {
    return {
      id: c.id,
      episodeId: c.episodeId,
      author: {
        id: c.user.id,
        username: c.user.username,
        avatarUrl: c.user.avatarUrl ?? null,
      },
      parentId: c.parentId ?? null,
      content: c.content,
      isSpoiler: c.isSpoiler,
      status: c.status,
      likeCount: c._count.likes,
      replyCount: c._count.replies,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      editedAt: c.editedAt ?? null,
    };
  }

  private async toDtoWithLiked(c: CommentWithMeta, userId?: number): Promise<CommentWithLikedDto> {
    const likedByMe = userId ? await this.repo.hasLiked(userId, c.id) : false;
    return { ...this.toDto(c), likedByMe };
  }
}
