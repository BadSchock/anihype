import { Injectable, NotFoundException } from '@nestjs/common';
import { HypeTransactionReason, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRatingDto } from './dto/rating.dto';
import { HypeService } from '../hype/hype.service';

const MIN_RATINGS_FOR_RANKING = 10;

@Injectable()
export class RatingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly hypeService: HypeService,
  ) {}

  /** Nota final: (animation + story + characters + sound + hype*2) / 6 */
  static computeFinalScore(dto: Pick<CreateRatingDto, 'animation' | 'story' | 'characters' | 'sound' | 'hype'>): number {
    return (dto.animation + dto.story + dto.characters + dto.sound + dto.hype * 2) / 6;
  }

  static getBadge(score: number): { label: string; emoji: string } {
    if (score >= 9.0) return { label: 'Obra-Prima', emoji: '👑' };
    if (score >= 8.0) return { label: 'Excelente', emoji: '🔥' };
    if (score >= 7.0) return { label: 'Recomendado', emoji: '⭐' };
    if (score >= 5.0) return { label: 'Ok', emoji: '👍' };
    return { label: 'Decepcionante', emoji: '💤' };
  }

  async upsertRating(userId: number, animeSlug: string, dto: CreateRatingDto) {
    const anime = await this.prisma.anime.findFirst({
      where: { slug: animeSlug, deletedAt: null },
      select: { id: true },
    });
    if (!anime) throw new NotFoundException('Anime não encontrado');

    const existing = await this.prisma.animeRating.findFirst({
      where: { userId, animeId: anime.id, deletedAt: null },
    });

    const finalScore = new Prisma.Decimal(
      RatingsService.computeFinalScore(dto).toFixed(2),
    );

    const rating = await this.prisma.animeRating.upsert({
      where: { userId_animeId: { userId, animeId: anime.id } },
      create: {
        userId,
        animeId: anime.id,
        animation: dto.animation,
        story: dto.story,
        characters: dto.characters,
        sound: dto.sound,
        hype: dto.hype,
        finalScore,
        reviewText: dto.reviewText ?? null,
        containsSpoiler: dto.containsSpoiler ?? false,
      },
      update: {
        animation: dto.animation,
        story: dto.story,
        characters: dto.characters,
        sound: dto.sound,
        hype: dto.hype,
        finalScore,
        reviewText: dto.reviewText ?? null,
        containsSpoiler: dto.containsSpoiler ?? false,
        deletedAt: null,
      },
    });

    await this.recalculateAnimeAggregates(anime.id);

    if (!existing) {
      void this.hypeService.awardXp({
        userId,
        reason: HypeTransactionReason.RATING_POSTED,
        referenceId: rating.id,
      });
    }

    return { ...rating, badge: RatingsService.getBadge(Number(finalScore)) };
  }

  async getMyRating(userId: number, animeSlug: string) {
    const anime = await this.prisma.anime.findFirst({
      where: { slug: animeSlug, deletedAt: null },
      select: { id: true },
    });
    if (!anime) throw new NotFoundException('Anime não encontrado');

    const rating = await this.prisma.animeRating.findFirst({
      where: { userId, animeId: anime.id, deletedAt: null },
    });

    if (!rating) return null;

    return { ...rating, badge: RatingsService.getBadge(Number(rating.finalScore)) };
  }

  async deleteMyRating(userId: number, animeSlug: string) {
    const anime = await this.prisma.anime.findFirst({
      where: { slug: animeSlug, deletedAt: null },
      select: { id: true },
    });
    if (!anime) throw new NotFoundException('Anime não encontrado');

    await this.prisma.animeRating.updateMany({
      where: { userId, animeId: anime.id, deletedAt: null },
      data: { deletedAt: new Date() },
    });

    await this.recalculateAnimeAggregates(anime.id);
    return { message: 'Avaliação removida com sucesso.' };
  }

  async getAnimeRatings(animeSlug: string, page = 1, limit = 20) {
    const anime = await this.prisma.anime.findFirst({
      where: { slug: animeSlug, deletedAt: null },
      select: {
        id: true,
        ratingCount: true,
        ratingAverage: true,
        ratingAnimation: true,
        ratingStory: true,
        ratingCharacters: true,
        ratingSound: true,
        ratingHype: true,
      },
    });
    if (!anime) throw new NotFoundException('Anime não encontrado');

    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      this.prisma.animeRating.findMany({
        where: { animeId: anime.id, deletedAt: null, reviewText: { not: null } },
        include: { user: { select: { id: true, username: true, displayName: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.animeRating.count({
        where: { animeId: anime.id, deletedAt: null, reviewText: { not: null } },
      }),
    ]);

    const average = Number(anime.ratingAverage ?? 0);

    return {
      aggregate: {
        count: anime.ratingCount,
        average,
        badge: anime.ratingCount > 0 ? RatingsService.getBadge(average) : null,
        qualifiesForRanking: anime.ratingCount >= MIN_RATINGS_FOR_RANKING,
        dimensions: {
          animation: Number(anime.ratingAnimation ?? 0),
          story: Number(anime.ratingStory ?? 0),
          characters: Number(anime.ratingCharacters ?? 0),
          sound: Number(anime.ratingSound ?? 0),
          hype: Number(anime.ratingHype ?? 0),
        },
      },
      reviews: reviews.map((r) => ({
        ...r,
        finalScore: Number(r.finalScore),
        badge: RatingsService.getBadge(Number(r.finalScore)),
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getFeaturedReview() {
    const rating = await this.prisma.animeRating.findFirst({
      where: {
        deletedAt: null,
        reviewText: { not: null },
        NOT: { reviewText: '' },
        finalScore: { gte: new Prisma.Decimal('7.0') },
      },
      orderBy: [{ finalScore: 'desc' }, { createdAt: 'desc' }],
      include: {
        user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        anime: {
          select: {
            slug: true,
            titleRomaji: true,
            titleEnglish: true,
            coverImageUrl: true,
          },
        },
      },
    });

    if (!rating) return null;

    return {
      id: rating.id,
      finalScore: Number(rating.finalScore),
      reviewText: rating.reviewText,
      containsSpoiler: rating.containsSpoiler,
      badge: RatingsService.getBadge(Number(rating.finalScore)),
      user: rating.user,
      anime: rating.anime,
      createdAt: rating.createdAt.toISOString(),
    };
  }

  // ---------------------------------------------------------------------------

  private async recalculateAnimeAggregates(animeId: number) {
    const agg = await this.prisma.animeRating.aggregate({
      where: { animeId, deletedAt: null },
      _count: { id: true },
      _avg: {
        animation: true,
        story: true,
        characters: true,
        sound: true,
        hype: true,
        finalScore: true,
      },
    });

    const count = agg._count.id;
    const avg = agg._avg;

    await this.prisma.anime.update({
      where: { id: animeId },
      data: {
        ratingCount: count,
        ratingAverage: avg.finalScore != null ? new Prisma.Decimal(avg.finalScore.toFixed(2)) : null,
        ratingAnimation: avg.animation != null ? new Prisma.Decimal(avg.animation.toFixed(2)) : null,
        ratingStory: avg.story != null ? new Prisma.Decimal(avg.story.toFixed(2)) : null,
        ratingCharacters: avg.characters != null ? new Prisma.Decimal(avg.characters.toFixed(2)) : null,
        ratingSound: avg.sound != null ? new Prisma.Decimal(avg.sound.toFixed(2)) : null,
        ratingHype: avg.hype != null ? new Prisma.Decimal(avg.hype.toFixed(2)) : null,
      },
    });
  }
}
