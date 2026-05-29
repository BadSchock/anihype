import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

const USER_SELECT = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
  bio: true,
} as const;

@Injectable()
export class UserFollowService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private async resolveUser(username: string) {
    const user = await this.prisma.user.findFirst({
      where: { username: username.toLowerCase(), deletedAt: null },
      select: { id: true, username: true },
    });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user;
  }

  async getSocialCounts(username: string) {
    const user = await this.resolveUser(username);

    const [followerCount, followingCount] = await Promise.all([
      this.prisma.userFollow.count({ where: { followingId: user.id } }),
      this.prisma.userFollow.count({ where: { followerId: user.id } }),
    ]);

    return { followerCount, followingCount };
  }

  async follow(followerId: number, username: string) {
    const target = await this.resolveUser(username);

    if (target.id === followerId) {
      throw new BadRequestException('Você não pode seguir a si mesmo.');
    }

    const existing = await this.prisma.userFollow.findUnique({
      where: {
        followerId_followingId: { followerId, followingId: target.id },
      },
    });

    await this.prisma.userFollow.upsert({
      where: {
        followerId_followingId: { followerId, followingId: target.id },
      },
      create: { followerId, followingId: target.id },
      update: {},
    });

    if (!existing) {
      void this.notificationsService.notifyUserFollowed(followerId, target.id);
    }

    return { following: true, message: 'Usuário seguido com sucesso.' };
  }

  async unfollow(followerId: number, username: string) {
    const target = await this.resolveUser(username);

    await this.prisma.userFollow.deleteMany({
      where: { followerId, followingId: target.id },
    });

    return { following: false, message: 'Deixou de seguir o usuário.' };
  }

  async getFollowStatus(followerId: number, username: string) {
    const target = await this.resolveUser(username);

    const row = await this.prisma.userFollow.findUnique({
      where: {
        followerId_followingId: { followerId, followingId: target.id },
      },
    });

    return { following: !!row };
  }

  async getFollowers(username: string, page = 1, limit = 24) {
    const user = await this.resolveUser(username);
    return this.listUsers('followers', user.id, page, limit);
  }

  async getFollowingUsers(username: string, page = 1, limit = 24) {
    const user = await this.resolveUser(username);
    return this.listUsers('following', user.id, page, limit);
  }

  private async listUsers(
    kind: 'followers' | 'following',
    userId: number,
    page: number,
    limit: number,
  ) {
    const skip = (page - 1) * limit;
    const where =
      kind === 'followers'
        ? { followingId: userId }
        : { followerId: userId };

    const [rows, total] = await Promise.all([
      this.prisma.userFollow.findMany({
        where,
        include: {
          follower: { select: USER_SELECT },
          following: { select: USER_SELECT },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.userFollow.count({ where }),
    ]);

    return {
      data: rows.map((row) => ({
        followedAt: row.createdAt.toISOString(),
        user: kind === 'followers' ? row.follower : row.following,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getFollowingUserIds(followerId: number): Promise<number[]> {
    const rows = await this.prisma.userFollow.findMany({
      where: { followerId },
      select: { followingId: true },
    });
    return rows.map((r) => r.followingId);
  }
}
