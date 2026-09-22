import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateHighlightDto, UpdateHighlightDto } from './dto/highlight.dto';
import { publicAnimeWhere } from '../../common/content/public-anime';
import { cleanSynopsis } from '../../common/content/synopsis';

const animeSelect = {
  id: true,
  slug: true,
  titleRomaji: true,
  titleEnglish: true,
  coverImageUrl: true,
  bannerImageUrl: true,
  synopsis: true,
  ratingAverage: true,
  ratingCount: true,
} satisfies Prisma.AnimeSelect;

@Injectable()
export class HighlightsService {
  constructor(private readonly prisma: PrismaService) {}

  async getHeroHighlight() {
    const now = new Date();

    const highlight = await this.prisma.seasonalHighlight.findFirst({
      where: {
        published: true,
        isFeatured: true,
        anime: publicAnimeWhere(),
        AND: [
          { OR: [{ visibleFrom: null }, { visibleFrom: { lte: now } }] },
          { OR: [{ visibleUntil: null }, { visibleUntil: { gte: now } }] },
        ],
      },
      orderBy: [{ heroPosition: 'asc' }, { updatedAt: 'desc' }],
      include: { anime: { select: animeSelect } },
    });

    if (!highlight) return null;
    return this.toDto(highlight);
  }

  async findAll() {
    const items = await this.prisma.seasonalHighlight.findMany({
      orderBy: [{ heroPosition: 'asc' }, { updatedAt: 'desc' }],
      include: { anime: { select: animeSelect } },
    });
    return items.map((h) => this.toDto(h));
  }

  async create(dto: CreateHighlightDto) {
    const anime = await this.prisma.anime.findFirst({
      where: { id: dto.animeId, deletedAt: null },
      select: animeSelect,
    });
    if (!anime) throw new NotFoundException('Anime não encontrado');

    const highlight = await this.prisma.seasonalHighlight.create({
      data: {
        animeId: dto.animeId,
        title: dto.title ?? anime.titleEnglish ?? anime.titleRomaji,
        subtitle: dto.subtitle ?? cleanSynopsis(anime.synopsis)?.slice(0, 140) ?? null,
        imageUrl: dto.imageUrl ?? anime.bannerImageUrl ?? anime.coverImageUrl,
        ctaLabel: dto.ctaLabel ?? 'Ver anime',
        destination: dto.destination ?? `/anime/${anime.slug}`,
        season: dto.season ?? null,
        year: dto.year ?? null,
        heroPosition: dto.heroPosition ?? 0,
        isFeatured: dto.isFeatured ?? true,
        published: dto.published ?? true,
      },
      include: { anime: { select: animeSelect } },
    });

    return this.toDto(highlight);
  }

  async update(id: number, dto: UpdateHighlightDto) {
    await this.findRaw(id);

    const highlight = await this.prisma.seasonalHighlight.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.subtitle !== undefined && { subtitle: dto.subtitle }),
        ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
        ...(dto.ctaLabel !== undefined && { ctaLabel: dto.ctaLabel }),
        ...(dto.destination !== undefined && { destination: dto.destination }),
        ...(dto.heroPosition !== undefined && { heroPosition: dto.heroPosition }),
        ...(dto.isFeatured !== undefined && { isFeatured: dto.isFeatured }),
        ...(dto.published !== undefined && { published: dto.published }),
      },
      include: { anime: { select: animeSelect } },
    });

    return this.toDto(highlight);
  }

  async remove(id: number) {
    await this.findRaw(id);
    await this.prisma.seasonalHighlight.delete({ where: { id } });
    return { message: 'Destaque removido.' };
  }

  private async findRaw(id: number) {
    const item = await this.prisma.seasonalHighlight.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`Destaque ${id} não encontrado.`);
    return item;
  }

  private toDto(
    h: Prisma.SeasonalHighlightGetPayload<{ include: { anime: { select: typeof animeSelect } } }>,
  ) {
    return {
      id: h.id,
      animeId: h.animeId,
      title: h.title,
      subtitle: h.subtitle,
      imageUrl: h.imageUrl,
      ctaLabel: h.ctaLabel,
      destination: h.destination,
      season: h.season,
      year: h.year,
      heroPosition: h.heroPosition,
      isFeatured: h.isFeatured,
      published: h.published,
      visibleFrom: h.visibleFrom,
      visibleUntil: h.visibleUntil,
      createdAt: h.createdAt,
      updatedAt: h.updatedAt,
      anime: {
        ...h.anime,
        ratingAverage: h.anime.ratingAverage ? Number(h.anime.ratingAverage) : null,
      },
    };
  }
}
