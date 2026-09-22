import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CommentQueryDto } from './dto/comment-query.dto';
import { PaginatedResult, paginate } from '../../common/dto/pagination.dto';
import { publicAnimeWhere } from '../../common/content/public-anime';

const commentInclude = {
  user: {
    select: {
      id: true,
      username: true,
      avatarUrl: true,
      profile: {
        select: {
          equippedBadge: {
            select: {
              id: true,
              slug: true,
              name: true,
              rarityColor: true,
              iconUrl: true,
            },
          },
        },
      },
    },
  },
  _count: {
    select: {
      likes: true,
      replies: true,
    },
  },
} satisfies Prisma.CommentInclude;

export type CommentWithMeta = Prisma.CommentGetPayload<{ include: typeof commentInclude }>;

@Injectable()
export class CommentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEpisode(
    episodeId: number,
    query: CommentQueryDto,
  ): Promise<PaginatedResult<CommentWithMeta>> {
    const { page, limit, rootOnly, parentId } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.CommentWhereInput = {
      episodeId,
      deletedAt: null,
      ...(rootOnly && { parentId: null }),
      ...(parentId !== undefined && { parentId }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.comment.findMany({
        where,
        include: commentInclude,
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.comment.count({ where }),
    ]);

    return paginate(data, total, page, limit);
  }

  async findById(id: number): Promise<CommentWithMeta | null> {
    return this.prisma.comment.findFirst({
      where: { id, deletedAt: null },
      include: commentInclude,
    });
  }

  async create(data: Prisma.CommentCreateInput): Promise<CommentWithMeta> {
    return this.prisma.comment.create({ data, include: commentInclude });
  }

  async update(id: number, data: Prisma.CommentUpdateInput): Promise<CommentWithMeta> {
    return this.prisma.comment.update({ where: { id }, data, include: commentInclude });
  }

  async softDelete(id: number): Promise<void> {
    await this.prisma.comment.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // ---------------------------------------------------------------------------
  // Likes
  // ---------------------------------------------------------------------------

  async hasLiked(userId: number, commentId: number): Promise<boolean> {
    const like = await this.prisma.commentLike.findUnique({
      where: { userId_commentId: { userId, commentId } },
    });
    return like !== null;
  }

  async addLike(userId: number, commentId: number): Promise<{ id: number }> {
    const like = await this.prisma.commentLike.upsert({
      where: { userId_commentId: { userId, commentId } },
      create: { userId, commentId },
      update: {},
    });
    return { id: like.id };
  }

  async removeLike(userId: number, commentId: number): Promise<void> {
    await this.prisma.commentLike.deleteMany({ where: { userId, commentId } });
  }

  async getLikeCount(commentId: number): Promise<number> {
    return this.prisma.commentLike.count({ where: { commentId } });
  }

  async findHot(limit: number, days: number) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const comments = await this.prisma.comment.findMany({
      where: {
        deletedAt: null,
        parentId: null,
        createdAt: { gte: since },
        episode: { anime: publicAnimeWhere() },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            profile: {
              select: {
                equippedBadge: {
                  select: {
                    id: true,
                    slug: true,
                    name: true,
                    rarityColor: true,
                    iconUrl: true,
                  },
                },
              },
            },
          },
        },
        episode: {
          include: {
            anime: {
              select: {
                id: true,
                slug: true,
                titleRomaji: true,
                titleEnglish: true,
                coverImageUrl: true,
              },
            },
          },
        },
        _count: { select: { likes: true, replies: true } },
      },
      take: 60,
    });

    return comments
      .sort((a, b) => {
        const scoreA = a._count.likes * 3 + a._count.replies;
        const scoreB = b._count.likes * 3 + b._count.replies;
        return scoreB - scoreA || b.createdAt.getTime() - a.createdAt.getTime();
      })
      .slice(0, limit);
  }
}
