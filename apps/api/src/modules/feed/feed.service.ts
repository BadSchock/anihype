import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserFollowService } from '../user-follow/user-follow.service';

export type FeedItemType = 'COMMENT' | 'RATING' | 'ANIME_FOLLOW';

export interface FeedItemDto {
  type: FeedItemType;
  createdAt: string;
  user: {
    id: number;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  comment?: {
    id: number;
    content: string;
    isSpoiler: boolean;
    episode: {
      number: number;
      title: string | null;
      anime: { slug: string; titleEnglish: string | null; titleRomaji: string; coverImageUrl: string | null };
    };
  };
  rating?: {
    id: number;
    finalScore: number;
    reviewText: string | null;
    containsSpoiler: boolean;
    badge: { label: string; emoji: string };
    anime: { slug: string; titleEnglish: string | null; titleRomaji: string; coverImageUrl: string | null };
  };
  animeFollow?: {
    anime: { slug: string; titleEnglish: string | null; titleRomaji: string; coverImageUrl: string | null };
  };
}

const USER_SELECT = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
} as const;

@Injectable()
export class FeedService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userFollowService: UserFollowService,
  ) {}

  async getMyFeed(userId: number, page = 1, limit = 20) {
    const followingIds = await this.userFollowService.getFollowingUserIds(userId);

    if (!followingIds.length) {
      return {
        data: [] as FeedItemDto[],
        meta: { total: 0, page, limit, totalPages: 0 },
      };
    }

    const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

    const [comments, ratings, animeFollows] = await Promise.all([
      this.prisma.comment.findMany({
        where: {
          userId: { in: followingIds },
          deletedAt: null,
          parentId: null,
          createdAt: { gte: since },
        },
        include: {
          user: { select: USER_SELECT },
          episode: {
            include: {
              anime: {
                select: {
                  slug: true,
                  titleEnglish: true,
                  titleRomaji: true,
                  coverImageUrl: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 40,
      }),
      this.prisma.animeRating.findMany({
        where: {
          userId: { in: followingIds },
          deletedAt: null,
          createdAt: { gte: since },
        },
        include: {
          user: { select: USER_SELECT },
          anime: {
            select: {
              slug: true,
              titleEnglish: true,
              titleRomaji: true,
              coverImageUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 40,
      }),
      this.prisma.animeFollow.findMany({
        where: {
          userId: { in: followingIds },
          createdAt: { gte: since },
        },
        include: {
          user: { select: USER_SELECT },
          anime: {
            select: {
              slug: true,
              titleEnglish: true,
              titleRomaji: true,
              coverImageUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 40,
      }),
    ]);

    const items: FeedItemDto[] = [
      ...comments.map((c) => ({
        type: 'COMMENT' as const,
        createdAt: c.createdAt.toISOString(),
        user: {
          ...c.user,
          displayName: c.user.displayName ?? null,
          avatarUrl: c.user.avatarUrl ?? null,
        },
        comment: {
          id: c.id,
          content: c.content,
          isSpoiler: c.isSpoiler,
          episode: {
            number: c.episode.number,
            title: c.episode.title ?? null,
            anime: c.episode.anime,
          },
        },
      })),
      ...ratings.map((r) => ({
        type: 'RATING' as const,
        createdAt: r.createdAt.toISOString(),
        user: {
          ...r.user,
          displayName: r.user.displayName ?? null,
          avatarUrl: r.user.avatarUrl ?? null,
        },
        rating: {
          id: r.id,
          finalScore: Number(r.finalScore),
          reviewText: r.reviewText ?? null,
          containsSpoiler: r.containsSpoiler,
          badge: this.ratingBadge(Number(r.finalScore)),
          anime: r.anime,
        },
      })),
      ...animeFollows.map((f) => ({
        type: 'ANIME_FOLLOW' as const,
        createdAt: f.createdAt.toISOString(),
        user: {
          ...f.user,
          displayName: f.user.displayName ?? null,
          avatarUrl: f.user.avatarUrl ?? null,
        },
        animeFollow: { anime: f.anime },
      })),
    ];

    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = items.length;
    const skip = (page - 1) * limit;
    const data = items.slice(skip, skip + limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUserActivity(username: string, page = 1, limit = 15) {
    const user = await this.prisma.user.findFirst({
      where: { username: username.toLowerCase(), deletedAt: null },
      select: { id: true },
    });
    if (!user) return { data: [], meta: { total: 0, page, limit, totalPages: 0 } };

    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [comments, ratings] = await Promise.all([
      this.prisma.comment.findMany({
        where: {
          userId: user.id,
          deletedAt: null,
          parentId: null,
          createdAt: { gte: since },
        },
        include: {
          user: { select: USER_SELECT },
          episode: {
            include: {
              anime: {
                select: {
                  slug: true,
                  titleEnglish: true,
                  titleRomaji: true,
                  coverImageUrl: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
      this.prisma.animeRating.findMany({
        where: {
          userId: user.id,
          deletedAt: null,
          createdAt: { gte: since },
        },
        include: {
          user: { select: USER_SELECT },
          anime: {
            select: {
              slug: true,
              titleEnglish: true,
              titleRomaji: true,
              coverImageUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
    ]);

    const items: FeedItemDto[] = [
      ...comments.map((c) => ({
        type: 'COMMENT' as const,
        createdAt: c.createdAt.toISOString(),
        user: {
          ...c.user,
          displayName: c.user.displayName ?? null,
          avatarUrl: c.user.avatarUrl ?? null,
        },
        comment: {
          id: c.id,
          content: c.content,
          isSpoiler: c.isSpoiler,
          episode: {
            number: c.episode.number,
            title: c.episode.title ?? null,
            anime: c.episode.anime,
          },
        },
      })),
      ...ratings.map((r) => ({
        type: 'RATING' as const,
        createdAt: r.createdAt.toISOString(),
        user: {
          ...r.user,
          displayName: r.user.displayName ?? null,
          avatarUrl: r.user.avatarUrl ?? null,
        },
        rating: {
          id: r.id,
          finalScore: Number(r.finalScore),
          reviewText: r.reviewText ?? null,
          containsSpoiler: r.containsSpoiler,
          badge: this.ratingBadge(Number(r.finalScore)),
          anime: r.anime,
        },
      })),
    ];

    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const total = items.length;
    const skip = (page - 1) * limit;

    return {
      data: items.slice(skip, skip + limit),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  private ratingBadge(score: number) {
    if (score >= 9) return { label: 'Obra-Prima', emoji: '👑' };
    if (score >= 8) return { label: 'Excelente', emoji: '🔥' };
    if (score >= 7) return { label: 'Recomendado', emoji: '⭐' };
    if (score >= 5) return { label: 'Ok', emoji: '👍' };
    return { label: 'Decepcionante', emoji: '💤' };
  }
}
