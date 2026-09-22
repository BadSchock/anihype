import { Injectable } from '@nestjs/common';
import { Anime, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AnimeQueryDto } from './dto/anime-query.dto';
import { PaginatedResult, paginate } from '../../common/dto/pagination.dto';
import { buildGenreAndConditions } from './genre-filter.util';
import { publicAnimeWhere } from '../../common/content/public-anime';

const animeInclude = {
  genres: {
    include: {
      genre: { select: { id: true, name: true, slug: true } },
    },
  },
  studios: {
    include: {
      studio: { select: { id: true, name: true } },
    },
  },
  streamingLinks: {
    include: {
      platform: { select: { id: true, name: true, slug: true, homepageUrl: true } },
    },
  },
} satisfies Prisma.AnimeInclude;

type AnimeWithRelations = Prisma.AnimeGetPayload<{ include: typeof animeInclude }>;

@Injectable()
export class AnimeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(
    query: AnimeQueryDto,
    resolvedGenreIds?: number[],
  ): Promise<PaginatedResult<AnimeWithRelations>> {
    const { page, limit, search, status, format, season, seasonYear, orderBy } = query;
    const skip = (page - 1) * limit;

    const genreAnd =
      resolvedGenreIds && resolvedGenreIds.length > 0
        ? buildGenreAndConditions(resolvedGenreIds)
        : undefined;

    const where: Prisma.AnimeWhereInput = {
      deletedAt: null,
      ...publicAnimeWhere(),
      ...(status && { status }),
      ...(format && { format }),
      ...(season && { season }),
      ...(seasonYear && { seasonYear }),
      ...(genreAnd && { AND: genreAnd }),
      ...(search && {
        OR: [
          { titleRomaji: { contains: search, mode: 'insensitive' } },
          { titleEnglish: { contains: search, mode: 'insensitive' } },
          { titleNative: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const orderByClause = this.buildOrderBy(orderBy);

    const [data, total] = await this.prisma.$transaction([
      this.prisma.anime.findMany({ where, include: animeInclude, orderBy: orderByClause, skip, take: limit }),
      this.prisma.anime.count({ where }),
    ]);

    return paginate(data, total, page, limit);
  }

  async findAllGenres(): Promise<{ id: number; name: string; slug: string }[]> {
    return this.prisma.genre.findMany({
      where: { slug: { not: 'hentai' } },
      select: { id: true, name: true, slug: true },
      orderBy: { name: 'asc' },
    });
  }

  async findGenreIdsBySlugs(slugs: string[]): Promise<number[]> {
    if (slugs.length === 0) return [];
    const rows = await this.prisma.genre.findMany({
      where: { slug: { in: slugs } },
      select: { id: true },
    });
    return rows.map((r) => r.id);
  }

  async findById(id: number): Promise<AnimeWithRelations | null> {
    return this.prisma.anime.findFirst({
      where: { id, deletedAt: null, ...publicAnimeWhere() },
      include: animeInclude,
    });
  }

  async findBySlug(slug: string): Promise<AnimeWithRelations | null> {
    return this.prisma.anime.findFirst({
      where: { slug, deletedAt: null, ...publicAnimeWhere() },
      include: animeInclude,
    });
  }

  async findByIdOrSlug(idOrSlug: string): Promise<AnimeWithRelations | null> {
    const asNumber = parseInt(idOrSlug, 10);
    if (!isNaN(asNumber)) {
      return this.findById(asNumber);
    }
    return this.findBySlug(idOrSlug);
  }

  async updateSynopsis(id: number, synopsis: string): Promise<void> {
    await this.prisma.anime.update({ where: { id }, data: { synopsis } });
  }

  async existsBySlug(slug: string, excludeId?: number): Promise<boolean> {
    const count = await this.prisma.anime.count({
      where: { slug, deletedAt: null, ...(excludeId && { id: { not: excludeId } }) },
    });
    return count > 0;
  }

  private buildOrderBy(orderBy?: string): Prisma.AnimeOrderByWithRelationInput {
    switch (orderBy) {
      case 'score':
        return { averageScore: 'desc' };
      case 'rating':
        return { ratingAverage: { sort: 'desc', nulls: 'last' } };
      case 'recent':
        return { createdAt: 'desc' };
      case 'title':
        return { titleRomaji: 'asc' };
      case 'popular':
      default:
        return { popularityScore: 'desc' };
    }
  }
}

export type { AnimeWithRelations, Anime };
