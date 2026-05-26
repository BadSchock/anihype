import { Injectable } from '@nestjs/common';
import { EpisodeStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { EpisodeQueryDto } from './dto/episode-query.dto';
import { PaginatedResult, paginate } from '../../common/dto/pagination.dto';

const episodeInclude = {
  anime: {
    select: {
      id: true,
      slug: true,
      titleRomaji: true,
      titleEnglish: true,
      coverImageUrl: true,
    },
  },
} satisfies Prisma.EpisodeInclude;

export type EpisodeWithAnime = Prisma.EpisodeGetPayload<{ include: typeof episodeInclude }>;

@Injectable()
export class EpisodesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByAnime(
    animeId: number,
    query: EpisodeQueryDto,
  ): Promise<PaginatedResult<EpisodeWithAnime>> {
    const { page, limit, status, numberFrom } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.EpisodeWhereInput = {
      animeId,
      deletedAt: null,
      ...(status && { status }),
      ...(numberFrom && { number: { gte: numberFrom } }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.episode.findMany({
        where,
        include: episodeInclude,
        orderBy: { number: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.episode.count({ where }),
    ]);

    return paginate(data, total, page, limit);
  }

  async findById(id: number): Promise<EpisodeWithAnime | null> {
    return this.prisma.episode.findFirst({
      where: { id, deletedAt: null },
      include: episodeInclude,
    });
  }

  async findByAnimeAndNumber(animeId: number, number: number): Promise<EpisodeWithAnime | null> {
    return this.prisma.episode.findFirst({
      where: { animeId, number, deletedAt: null },
      include: episodeInclude,
    });
  }

  async findByAnimeAndSlug(animeId: number, slug: string): Promise<EpisodeWithAnime | null> {
    return this.prisma.episode.findFirst({
      where: { animeId, slug, deletedAt: null },
      include: episodeInclude,
    });
  }

  /**
   * Retorna episódios que foram ao ar hoje (UTC).
   */
  async findTodayReleases(): Promise<EpisodeWithAnime[]> {
    const now = new Date();
    const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    return this.prisma.episode.findMany({
      where: {
        deletedAt: null,
        status: { not: EpisodeStatus.UNKNOWN },
        airDate: { gte: startOfDay, lt: endOfDay },
      },
      include: episodeInclude,
      orderBy: [{ airTimeUtc: 'asc' }, { airDate: 'asc' }],
    });
  }

  /**
   * Retorna episódios dos próximos N dias (padrão: 7) agrupados por data.
   */
  async findWeeklyCalendar(days: number = 7): Promise<EpisodeWithAnime[]> {
    const now = new Date();
    const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const endDate = new Date(startOfDay.getTime() + days * 24 * 60 * 60 * 1000);

    return this.prisma.episode.findMany({
      where: {
        deletedAt: null,
        airDate: { gte: startOfDay, lt: endDate },
      },
      include: episodeInclude,
      orderBy: [{ airDate: 'asc' }, { airTimeUtc: 'asc' }],
    });
  }
}
