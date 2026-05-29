import { Injectable, NotFoundException } from '@nestjs/common';
import { HypeTransactionReason } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { HypeService } from '../hype/hype.service';

const ANIME_SELECT = {
  id: true,
  slug: true,
  titleRomaji: true,
  titleEnglish: true,
  coverImageUrl: true,
  bannerImageUrl: true,
  status: true,
  season: true,
  seasonYear: true,
  ratingAverage: true,
  episodeCount: true,
} as const;

@Injectable()
export class AnimeFollowService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly hypeService: HypeService,
  ) {}

  private async resolveAnime(slug: string) {
    const anime = await this.prisma.anime.findFirst({
      where: { slug, deletedAt: null },
      select: { id: true },
    });
    if (!anime) throw new NotFoundException('Anime não encontrado');
    return anime;
  }

  private async resolveUser(username: string) {
    const user = await this.prisma.user.findFirst({
      where: { username: username.toLowerCase(), deletedAt: null },
      select: { id: true },
    });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user;
  }

  private mapFollowRow(row: {
    createdAt: Date;
    anime: {
      id: number;
      slug: string;
      titleRomaji: string;
      titleEnglish: string | null;
      coverImageUrl: string | null;
      bannerImageUrl: string | null;
      status: string;
      season: string | null;
      seasonYear: number | null;
      ratingAverage: unknown;
      episodeCount: number | null;
    };
  }) {
    return {
      followedAt: row.createdAt.toISOString(),
      anime: {
        ...row.anime,
        ratingAverage: row.anime.ratingAverage ? Number(row.anime.ratingAverage) : null,
      },
    };
  }

  async follow(userId: number, slug: string) {
    const anime = await this.resolveAnime(slug);

    const existing = await this.prisma.animeFollow.findUnique({
      where: { userId_animeId: { userId, animeId: anime.id } },
    });

    const follow = await this.prisma.animeFollow.upsert({
      where: { userId_animeId: { userId, animeId: anime.id } },
      create: { userId, animeId: anime.id },
      update: {},
    });

    if (!existing) {
      void this.hypeService.awardXp({
        userId,
        reason: HypeTransactionReason.ANIME_FOLLOWED,
        referenceId: follow.id,
      });
    }

    return { following: true, message: 'Anime seguido com sucesso.' };
  }

  async unfollow(userId: number, slug: string) {
    const anime = await this.resolveAnime(slug);

    await this.prisma.animeFollow.deleteMany({
      where: { userId, animeId: anime.id },
    });

    return { following: false, message: 'Deixou de seguir o anime.' };
  }

  async getFollowStatus(userId: number, slug: string) {
    const anime = await this.resolveAnime(slug);

    const row = await this.prisma.animeFollow.findUnique({
      where: { userId_animeId: { userId, animeId: anime.id } },
    });

    return { following: !!row };
  }

  async getFollowingByUsername(username: string, page = 1, limit = 24) {
    const user = await this.resolveUser(username);
    return this.getFollowingByUserId(user.id, page, limit);
  }

  async getFollowingByUserId(userId: number, page = 1, limit = 24) {
    const skip = (page - 1) * limit;

    const [rows, total] = await Promise.all([
      this.prisma.animeFollow.findMany({
        where: { userId },
        include: { anime: { select: ANIME_SELECT } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.animeFollow.count({ where: { userId } }),
    ]);

    return {
      data: rows.map((r) => this.mapFollowRow(r)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
