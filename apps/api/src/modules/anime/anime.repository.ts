import { Injectable } from '@nestjs/common';
import { Anime, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AnimeQueryDto } from './dto/anime-query.dto';
import { PaginatedResult, paginate } from '../../common/dto/pagination.dto';

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
} satisfies Prisma.AnimeInclude;

type AnimeWithRelations = Prisma.AnimeGetPayload<{ include: typeof animeInclude }>;

@Injectable()
export class AnimeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(query: AnimeQueryDto): Promise<PaginatedResult<AnimeWithRelations>> {
    const { page, limit, search, status, format, season, seasonYear, genreId, orderBy } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.AnimeWhereInput = {
      deletedAt: null,
      ...(status && { status }),
      ...(format && { format }),
      ...(season && { season }),
      ...(seasonYear && { seasonYear }),
      ...(genreId && { genres: { some: { genreId } } }),
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

  async findById(id: number): Promise<AnimeWithRelations | null> {
    return this.prisma.anime.findFirst({
      where: { id, deletedAt: null },
      include: animeInclude,
    });
  }

  async findBySlug(slug: string): Promise<AnimeWithRelations | null> {
    return this.prisma.anime.findFirst({
      where: { slug, deletedAt: null },
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
