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
   * Retorna episódios que foram ao ar hoje no horário de Brasília (UTC-3).
   */
  async findTodayReleases(): Promise<EpisodeWithAnime[]> {
    const { start, end } = this.brtDayRange(0, 1);
    return this.prisma.episode.findMany({
      where: {
        deletedAt: null,
        status: { not: EpisodeStatus.UNKNOWN },
        airDate: { gte: start, lt: end },
      },
      include: episodeInclude,
      orderBy: [{ airTimeUtc: 'asc' }, { airDate: 'asc' }],
    });
  }

  /**
   * Retorna episódios dos próximos N dias (padrão: 7) no horário de Brasília.
   */
  async findWeeklyCalendar(days: number = 7): Promise<EpisodeWithAnime[]> {
    const { start } = this.brtDayRange(0, 1);
    const end = new Date(start.getTime() + days * 24 * 60 * 60 * 1000);

    return this.prisma.episode.findMany({
      where: {
        deletedAt: null,
        airDate: { gte: start, lt: end },
      },
      include: episodeInclude,
      orderBy: [{ airDate: 'asc' }, { airTimeUtc: 'asc' }],
    });
  }

  async findRecentReleases(days: number = 7): Promise<EpisodeWithAnime[]> {
    const now = new Date();
    const { start: rangeStart } = this.brtDayRange(-(days - 1), 1);

    return this.prisma.episode.findMany({
      where: {
        deletedAt: null,
        OR: [
          {
            airTimeUtc: { not: null, gte: rangeStart, lte: now },
          },
          {
            airTimeUtc: null,
            airDate: { not: null, gte: rangeStart, lte: now },
            status: EpisodeStatus.AIRED,
          },
        ],
      },
      include: episodeInclude,
      orderBy: [{ airTimeUtc: 'desc' }, { airDate: 'desc' }],
    });
  }

  /**
   * Calcula início e fim de um intervalo de dias no fuso de Brasília (UTC-3).
   * offsetDays=0 = hoje BRT, durationDays=1 = só hoje.
   */
  private brtDayRange(offsetDays: number, durationDays: number): { start: Date; end: Date } {
    const BRT_OFFSET_MS = 3 * 60 * 60 * 1000; // UTC-3
    const nowUtc = Date.now();
    const nowBrt = nowUtc - BRT_OFFSET_MS;
    const brtDate = new Date(nowBrt);

    // Meia-noite BRT de hoje (em UTC)
    const brtMidnight = Date.UTC(
      brtDate.getUTCFullYear(),
      brtDate.getUTCMonth(),
      brtDate.getUTCDate(),
    ) + BRT_OFFSET_MS;

    const start = new Date(brtMidnight + offsetDays * 24 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + durationDays * 24 * 60 * 60 * 1000);
    return { start, end };
  }

  /** Episódios com mais comentários nos últimos N dias. */
  async findTrending(days: number, limit: number): Promise<Array<EpisodeWithAnime & { commentCount: number }>> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const grouped = await this.prisma.comment.groupBy({
      by: ['episodeId'],
      where: {
        deletedAt: null,
        createdAt: { gte: since },
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: limit * 3,
    });

    if (!grouped.length) return [];

    const countMap = new Map(grouped.map((g) => [g.episodeId, g._count.id]));
    const episodes = await this.prisma.episode.findMany({
      where: { id: { in: grouped.map((g) => g.episodeId) }, deletedAt: null },
      include: episodeInclude,
    });

    return episodes
      .map((ep) => ({ ...ep, commentCount: countMap.get(ep.id) ?? 0 }))
      .sort((a, b) => b.commentCount - a.commentCount)
      .slice(0, limit);
  }

  async countComments(episodeId: number): Promise<number> {
    return this.prisma.comment.count({
      where: { episodeId, deletedAt: null },
    });
  }
}
