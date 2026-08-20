import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ACHIEVEMENT_BADGES,
  ACHIEVEMENT_SLUGS,
  BadgeEvent,
  AchievementSlug,
  OG_MAX_USER_ID,
} from './badge.constants';

export interface EquippedBadgeDto {
  id: number;
  slug: string;
  name: string;
  rarityColor: string | null;
  iconUrl: string | null;
}

export interface BadgeProgressDto {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  rarityColor: string | null;
  iconUrl: string | null;
  earned: boolean;
  acquiredAt: string | null;
  isEquipped: boolean;
  progress: {
    current: number;
    target: number;
    hint: string;
  };
}

export interface AwardedBadgeDto {
  slug: string;
  name: string;
  rarityColor: string | null;
}

@Injectable()
export class BadgesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Avalia conquistas elegíveis após uma ação. Idempotente.
   * Falhas não propagam para o fluxo principal.
   */
  async awardIfEligible(
    userId: number,
    event: BadgeEvent,
  ): Promise<AwardedBadgeDto[]> {
    try {
      const slugs = this.slugsForEvent(event);
      const awarded: AwardedBadgeDto[] = [];

      for (const slug of slugs) {
        const ok = await this.tryAward(userId, slug);
        if (ok) {
          const meta = ACHIEVEMENT_BADGES.find((b) => b.slug === slug)!;
          awarded.push({
            slug,
            name: meta.name,
            rarityColor: meta.rarityColor,
          });
        }
      }

      return awarded;
    } catch {
      return [];
    }
  }

  async getBadgesByUsername(username: string): Promise<{
    badges: BadgeProgressDto[];
    equippedBadge: EquippedBadgeDto | null;
  }> {
    const user = await this.prisma.user.findFirst({
      where: { username: username.toLowerCase(), deletedAt: null },
      select: {
        id: true,
        profile: { select: { equippedBadgeId: true } },
        badges: {
          where: { badge: { slug: { in: [...ACHIEVEMENT_SLUGS] } } },
          include: { badge: true },
        },
      },
    });
    if (!user) throw new NotFoundException('Usuário não encontrado');

    const progressMap = await this.computeAllProgress(user.id);
    const earnedBySlug = new Map(
      user.badges.map((ub) => [ub.badge.slug, ub] as const),
    );

    const catalog = await this.prisma.badge.findMany({
      where: { slug: { in: [...ACHIEVEMENT_SLUGS] } },
    });
    const bySlug = new Map(catalog.map((b) => [b.slug, b]));

    const badges: BadgeProgressDto[] = ACHIEVEMENT_BADGES.map((def) => {
      const row = bySlug.get(def.slug);
      const earned = earnedBySlug.get(def.slug);
      const progress = progressMap[def.slug];
      const isEquipped =
        !!earned && user.profile?.equippedBadgeId === (row?.id ?? earned.badgeId);

      return {
        id: row?.id ?? 0,
        slug: def.slug,
        name: row?.name ?? def.name,
        description: row?.description ?? def.description,
        rarityColor: row?.rarityColor ?? def.rarityColor,
        iconUrl: row?.iconUrl ?? null,
        earned: !!earned,
        acquiredAt: earned?.acquiredAt.toISOString() ?? null,
        isEquipped,
        progress: {
          current: progress.current,
          target: progress.target,
          hint: progress.hint,
        },
      };
    });

    let equippedBadge: EquippedBadgeDto | null = null;
    if (user.profile?.equippedBadgeId) {
      const eq = catalog.find((b) => b.id === user.profile!.equippedBadgeId);
      if (eq && earnedBySlug.has(eq.slug)) {
        equippedBadge = {
          id: eq.id,
          slug: eq.slug,
          name: eq.name,
          rarityColor: eq.rarityColor,
          iconUrl: eq.iconUrl,
        };
      }
    }

    return { badges, equippedBadge };
  }

  async equipBadge(userId: number, badgeId: number | null): Promise<{
    equippedBadge: EquippedBadgeDto | null;
  }> {
    if (badgeId == null) {
      await this.prisma.$transaction(async (tx) => {
        await tx.userBadge.updateMany({
          where: { userId, isEquipped: true },
          data: { isEquipped: false },
        });
        await tx.userProfile.upsert({
          where: { userId },
          create: { userId, equippedBadgeId: null },
          update: { equippedBadgeId: null },
        });
      });
      return { equippedBadge: null };
    }

    const owned = await this.prisma.userBadge.findUnique({
      where: { userId_badgeId: { userId, badgeId } },
      include: { badge: true },
    });
    if (!owned) {
      throw new BadRequestException('Você ainda não conquistou este badge.');
    }
    if (!ACHIEVEMENT_SLUGS.includes(owned.badge.slug as AchievementSlug)) {
      throw new BadRequestException('Este badge não pode ser equipado.');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.userBadge.updateMany({
        where: { userId, isEquipped: true },
        data: { isEquipped: false },
      });
      await tx.userBadge.update({
        where: { id: owned.id },
        data: { isEquipped: true },
      });
      await tx.userProfile.upsert({
        where: { userId },
        create: { userId, equippedBadgeId: badgeId },
        update: { equippedBadgeId: badgeId },
      });
    });

    return {
      equippedBadge: {
        id: owned.badge.id,
        slug: owned.badge.slug,
        name: owned.badge.name,
        rarityColor: owned.badge.rarityColor,
        iconUrl: owned.badge.iconUrl,
      },
    };
  }

  async getEquippedBadge(userId: number): Promise<EquippedBadgeDto | null> {
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
      include: { equippedBadge: true },
    });
    const b = profile?.equippedBadge;
    if (!b) return null;
    return {
      id: b.id,
      slug: b.slug,
      name: b.name,
      rarityColor: b.rarityColor,
      iconUrl: b.iconUrl,
    };
  }

  private slugsForEvent(event: BadgeEvent): AchievementSlug[] {
    switch (event) {
      case 'comment_created':
        return ['first-comment'];
      case 'rating_upserted':
        return ['first-rating', 'critic-on-duty'];
      case 'anime_followed':
        return ['marathoner'];
      case 'user_followed':
        return ['networker'];
      case 'like_received':
        return ['community-voice'];
      case 'xp_awarded':
        return ['hyped'];
      case 'user_registered':
        return ['og'];
      default:
        return [];
    }
  }

  private async tryAward(userId: number, slug: AchievementSlug): Promise<boolean> {
    const progress = await this.computeProgress(userId, slug);
    if (progress.current < progress.target) return false;

    const badge = await this.prisma.badge.findUnique({ where: { slug } });
    if (!badge) return false;

    const existing = await this.prisma.userBadge.findUnique({
      where: { userId_badgeId: { userId, badgeId: badge.id } },
    });
    if (existing) return false;

    await this.prisma.userBadge.create({
      data: { userId, badgeId: badge.id },
    });
    return true;
  }

  private async computeAllProgress(
    userId: number,
  ): Promise<Record<AchievementSlug, { current: number; target: number; hint: string }>> {
    const entries = await Promise.all(
      ACHIEVEMENT_SLUGS.map(async (slug) => [slug, await this.computeProgress(userId, slug)] as const),
    );
    return Object.fromEntries(entries) as Record<
      AchievementSlug,
      { current: number; target: number; hint: string }
    >;
  }

  async computeProgress(
    userId: number,
    slug: AchievementSlug,
  ): Promise<{ current: number; target: number; hint: string }> {
    const def = ACHIEVEMENT_BADGES.find((b) => b.slug === slug)!;
    const target = def.target;

    switch (slug) {
      case 'first-comment': {
        const current = await this.prisma.comment.count({
          where: { userId, deletedAt: null },
        });
        return {
          current: Math.min(current, target),
          target,
          hint: current >= target ? 'Conquistado!' : `${current}/${target} comentários`,
        };
      }
      case 'first-rating': {
        const current = await this.prisma.animeRating.count({
          where: { userId, deletedAt: null },
        });
        return {
          current: Math.min(current, target),
          target,
          hint: current >= target ? 'Conquistado!' : `${current}/${target} avaliações`,
        };
      }
      case 'critic-on-duty': {
        const current = await this.prisma.animeRating.count({
          where: {
            userId,
            deletedAt: null,
            reviewText: { not: null },
            NOT: { reviewText: '' },
          },
        });
        return {
          current: Math.min(current, target),
          target,
          hint: current >= target ? 'Conquistado!' : `${current}/${target} reviews`,
        };
      }
      case 'hyped': {
        const profile = await this.prisma.userProfile.findUnique({
          where: { userId },
          select: { hypeXp: true },
        });
        const current = profile?.hypeXp ?? 0;
        return {
          current: Math.min(current, target),
          target,
          hint: current >= target ? 'Conquistado!' : `${current}/${target} XP`,
        };
      }
      case 'marathoner': {
        const current = await this.prisma.animeFollow.count({ where: { userId } });
        return {
          current: Math.min(current, target),
          target,
          hint: current >= target ? 'Conquistado!' : `${current}/${target} animes seguidos`,
        };
      }
      case 'networker': {
        const current = await this.prisma.userFollow.count({
          where: { followerId: userId },
        });
        return {
          current: Math.min(current, target),
          target,
          hint: current >= target ? 'Conquistado!' : `${current}/${target} usuários seguidos`,
        };
      }
      case 'community-voice': {
        const current = await this.prisma.commentLike.count({
          where: { comment: { userId, deletedAt: null } },
        });
        return {
          current: Math.min(current, target),
          target,
          hint: current >= target ? 'Conquistado!' : `${current}/${target} likes recebidos`,
        };
      }
      case 'og': {
        const current = userId <= OG_MAX_USER_ID ? 1 : 0;
        return {
          current,
          target,
          hint: current >= target ? 'Conquistado!' : 'Reservado aos 100 primeiros',
        };
      }
      default:
        return { current: 0, target, hint: '—' };
    }
  }
}
