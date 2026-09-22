import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SetTopAnimeDto } from './dto/top-anime.dto';
import { publicAnimeWhere } from '../../common/content/public-anime';

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
} as const;

@Injectable()
export class TopAnimeService {
  constructor(private readonly prisma: PrismaService) {}

  async getTopAnime(username: string) {
    const user = await this.prisma.user.findFirst({
      where: { username: username.toLowerCase(), deletedAt: null },
      select: { id: true },
    });
    if (!user) throw new NotFoundException('Usuário não encontrado');

    const rows = await this.prisma.userTopAnime.findMany({
      where: { userId: user.id, anime: publicAnimeWhere() },
      include: { anime: { select: ANIME_SELECT } },
      orderBy: { position: 'asc' },
    });

    return rows.map((r) => ({
      position: r.position,
      anime: {
        ...r.anime,
        ratingAverage: r.anime.ratingAverage ? Number(r.anime.ratingAverage) : null,
      },
    }));
  }

  async setTopAnime(userId: number, dto: SetTopAnimeDto) {
    const positions = dto.items.map((i) => i.position);
    const hasDuplicatePos = new Set(positions).size !== positions.length;
    if (hasDuplicatePos) throw new BadRequestException('Posições duplicadas');

    const hasInvalidPos = positions.some((p) => p < 1 || p > 4);
    if (hasInvalidPos) throw new BadRequestException('Posição deve ser entre 1 e 4');

    const animeIds = dto.items.map((i) => i.animeId);
    const hasDuplicateAnime = new Set(animeIds).size !== animeIds.length;
    if (hasDuplicateAnime) throw new BadRequestException('Anime duplicado no Top 4');

    if (animeIds.length > 0) {
      const found = await this.prisma.anime.count({
        where: { id: { in: animeIds }, deletedAt: null, ...publicAnimeWhere() },
      });
      if (found !== animeIds.length) throw new NotFoundException('Um ou mais animes não encontrados');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.userTopAnime.deleteMany({ where: { userId } });

      if (dto.items.length > 0) {
        await tx.userTopAnime.createMany({
          data: dto.items.map((i) => ({
            userId,
            animeId: i.animeId,
            position: i.position,
          })),
        });
      }
    });

    return this.getTopAnimeByUserId(userId);
  }

  private async getTopAnimeByUserId(userId: number) {
    const rows = await this.prisma.userTopAnime.findMany({
      where: { userId, anime: publicAnimeWhere() },
      include: { anime: { select: ANIME_SELECT } },
      orderBy: { position: 'asc' },
    });

    return rows.map((r) => ({
      position: r.position,
      anime: {
        ...r.anime,
        ratingAverage: r.anime.ratingAverage ? Number(r.anime.ratingAverage) : null,
      },
    }));
  }
}
