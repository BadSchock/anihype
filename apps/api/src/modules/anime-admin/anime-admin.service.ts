import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EpisodeStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AnimeService } from '../anime/anime.service';
import { UpdateAnimeAdminDto, UpdateEpisodeAdminDto } from './dto/anime-admin.dto';

const ANIME_SELECT = {
  id: true,
  slug: true,
  titleRomaji: true,
  titleEnglish: true,
  coverImageUrl: true,
  bannerImageUrl: true,
  trailerUrl: true,
  isLocked: true,
  streamingLinks: {
    include: {
      platform: { select: { id: true, name: true, slug: true, homepageUrl: true } },
    },
  },
} as const;

@Injectable()
export class AnimeAdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getForEdit(slug: string) {
    const anime = await this.prisma.anime.findFirst({
      where: { slug, deletedAt: null },
      select: ANIME_SELECT,
    });
    if (!anime) throw new NotFoundException('Anime não encontrado');

    const episodes = await this.prisma.episode.findMany({
      where: { animeId: anime.id, deletedAt: null },
      select: {
        id: true,
        number: true,
        title: true,
        airTimeUtc: true,
        airDate: true,
        thumbnailUrl: true,
        status: true,
      },
      orderBy: { number: 'asc' },
      take: 50,
    });

    return {
      ...anime,
      episodes: episodes.map((ep) => ({
        ...ep,
        airTimeUtc: ep.airTimeUtc?.toISOString() ?? null,
        airDate: ep.airDate?.toISOString().slice(0, 10) ?? null,
      })),
    };
  }

  async updateAnime(slug: string, dto: UpdateAnimeAdminDto) {
    const anime = await this.prisma.anime.findFirst({
      where: { slug, deletedAt: null },
      select: { id: true },
    });
    if (!anime) throw new NotFoundException('Anime não encontrado');

    const data: Prisma.AnimeUpdateInput = {};

    if (dto.coverImageUrl !== undefined) data.coverImageUrl = dto.coverImageUrl;
    if (dto.bannerImageUrl !== undefined) data.bannerImageUrl = dto.bannerImageUrl;
    if (dto.trailerUrl !== undefined) data.trailerUrl = dto.trailerUrl;
    if (dto.isLocked !== undefined) data.isLocked = dto.isLocked;

    if (Object.keys(data).length > 0) {
      await this.prisma.anime.update({ where: { id: anime.id }, data });
    }

    if (dto.streamingLinks !== undefined) {
      await this.replaceStreamingLinks(anime.id, dto.streamingLinks);
    }

    return this.getForEdit(slug);
  }

  async updateEpisode(slug: string, number: number, dto: UpdateEpisodeAdminDto) {
    const anime = await this.prisma.anime.findFirst({
      where: { slug, deletedAt: null },
      select: { id: true },
    });
    if (!anime) throw new NotFoundException('Anime não encontrado');

    const episode = await this.prisma.episode.findFirst({
      where: { animeId: anime.id, number, deletedAt: null },
    });
    if (!episode) throw new NotFoundException('Episódio não encontrado');

    const data: Prisma.EpisodeUpdateInput = {};

    if (dto.title !== undefined) data.title = dto.title;
    if (dto.thumbnailUrl !== undefined) data.thumbnailUrl = dto.thumbnailUrl;

    if (dto.airTimeUtc !== undefined) {
      if (dto.airTimeUtc === null) {
        data.airTimeUtc = null;
      } else {
        const parsed = new Date(dto.airTimeUtc);
        if (Number.isNaN(parsed.getTime())) {
          throw new BadRequestException('airTimeUtc inválido');
        }
        data.airTimeUtc = parsed;
        data.airDate = parsed;
        data.status = parsed <= new Date() ? EpisodeStatus.AIRED : EpisodeStatus.UPCOMING;
      }
    }

    await this.prisma.episode.update({ where: { id: episode.id }, data });

    return this.getForEdit(slug);
  }

  private async replaceStreamingLinks(
    animeId: number,
    links: Array<{ platformName: string; url: string; regionCode?: string }>,
  ) {
    await this.prisma.animeStreamingPlatform.deleteMany({ where: { animeId } });

    for (const link of links) {
      const slug = AnimeService.normalizeSlug(link.platformName);
      const platform = await this.prisma.streamingPlatform.upsert({
        where: { slug },
        create: { name: link.platformName.trim(), slug },
        update: { name: link.platformName.trim() },
      });

      await this.prisma.animeStreamingPlatform.create({
        data: {
          animeId,
          platformId: platform.id,
          url: link.url.trim(),
          regionCode: link.regionCode?.trim() || null,
        },
      });
    }
  }
}
