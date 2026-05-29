import { Injectable } from '@nestjs/common';
import { NotificationChannelKind, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface CreateNotificationInput {
  userId: number;
  topic: string;
  body: string;
  payload?: Record<string, unknown>;
}

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateNotificationInput) {
    return this.prisma.notification.create({
      data: {
        userId: input.userId,
        topic: input.topic,
        body: input.body,
        payload: (input.payload ?? {}) as Prisma.InputJsonValue,
        channel: NotificationChannelKind.IN_APP,
      },
    });
  }

  async notifyUserFollowed(followerId: number, followingId: number) {
    if (followerId === followingId) return;

    const follower = await this.prisma.user.findUnique({
      where: { id: followerId },
      select: { username: true, displayName: true },
    });
    if (!follower) return;

    const name = follower.displayName ?? follower.username;

    await this.create({
      userId: followingId,
      topic: 'USER_FOLLOWED',
      body: `${name} começou a te seguir.`,
      payload: { followerId, username: follower.username },
    });
  }

  async notifyCommentLiked(commentId: number, likerId: number) {
    const comment = await this.prisma.comment.findFirst({
      where: { id: commentId, deletedAt: null },
      select: {
        userId: true,
        episode: {
          select: {
            number: true,
            anime: { select: { slug: true, titleEnglish: true, titleRomaji: true } },
          },
        },
      },
    });
    if (!comment || comment.userId === likerId) return;

    const liker = await this.prisma.user.findUnique({
      where: { id: likerId },
      select: { username: true, displayName: true },
    });
    if (!liker) return;

    const animeTitle =
      comment.episode.anime.titleEnglish ?? comment.episode.anime.titleRomaji;
    const name = liker.displayName ?? liker.username;

    await this.create({
      userId: comment.userId,
      topic: 'COMMENT_LIKED',
      body: `${name} curtiu seu comentário em ${animeTitle} Ep ${comment.episode.number}.`,
      payload: {
        commentId,
        likerId,
        animeSlug: comment.episode.anime.slug,
        episodeNumber: comment.episode.number,
      },
    });
  }

  async notifyCommentReply(parentId: number, replyAuthorId: number, replyId: number) {
    const parent = await this.prisma.comment.findFirst({
      where: { id: parentId, deletedAt: null },
      select: {
        userId: true,
        episode: {
          select: {
            number: true,
            anime: { select: { slug: true, titleEnglish: true, titleRomaji: true } },
          },
        },
      },
    });
    if (!parent || parent.userId === replyAuthorId) return;

    const author = await this.prisma.user.findUnique({
      where: { id: replyAuthorId },
      select: { username: true, displayName: true },
    });
    if (!author) return;

    const animeTitle = parent.episode.anime.titleEnglish ?? parent.episode.anime.titleRomaji;
    const name = author.displayName ?? author.username;

    await this.create({
      userId: parent.userId,
      topic: 'COMMENT_REPLY',
      body: `${name} respondeu seu comentário em ${animeTitle} Ep ${parent.episode.number}.`,
      payload: {
        replyId,
        parentId,
        authorId: replyAuthorId,
        animeSlug: parent.episode.anime.slug,
        episodeNumber: parent.episode.number,
      },
    });
  }

  /**
   * Notifica seguidores do anime quando um episódio vai ao ar.
   * Idempotente por usuário + episódio (não duplica no re-sync).
   */
  async notifyEpisodeAired(episodeId: number) {
    const episode = await this.prisma.episode.findFirst({
      where: { id: episodeId, deletedAt: null },
      select: {
        id: true,
        number: true,
        title: true,
        animeId: true,
        anime: {
          select: { slug: true, titleEnglish: true, titleRomaji: true },
        },
      },
    });
    if (!episode) return;

    const followers = await this.prisma.animeFollow.findMany({
      where: { animeId: episode.animeId, notifyOnEpisode: true },
      select: { userId: true },
    });
    if (!followers.length) return;

    const animeTitle = episode.anime.titleEnglish ?? episode.anime.titleRomaji;
    const epLabel = episode.title ?? `Episódio ${episode.number}`;

    await Promise.all(
      followers.map(async ({ userId }) => {
        const alreadySent = await this.prisma.notification.findFirst({
          where: {
            userId,
            topic: 'NEW_EPISODE',
            payload: { path: ['episodeId'], equals: episodeId },
          },
          select: { id: true },
        });
        if (alreadySent) return;

        await this.create({
          userId,
          topic: 'NEW_EPISODE',
          body: `${animeTitle} — ${epLabel} já está no ar!`,
          payload: {
            episodeId,
            animeId: episode.animeId,
            animeSlug: episode.anime.slug,
            episodeNumber: episode.number,
          },
        });
      }),
    );
  }

  async listForUser(userId: number, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [rows, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where: { userId } }),
      this.prisma.notification.count({ where: { userId, readAt: null } }),
    ]);

    return {
      data: rows.map((n) => ({
        id: n.id,
        topic: n.topic,
        body: n.body,
        payload: n.payload,
        readAt: n.readAt?.toISOString() ?? null,
        createdAt: n.createdAt.toISOString(),
      })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit), unreadCount },
    };
  }

  async getUnreadCount(userId: number) {
    const count = await this.prisma.notification.count({
      where: { userId, readAt: null },
    });
    return { unreadCount: count };
  }

  async markRead(userId: number, id: number) {
    await this.prisma.notification.updateMany({
      where: { id, userId },
      data: { readAt: new Date() },
    });
    return { success: true };
  }

  async markAllRead(userId: number) {
    await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { success: true };
  }
}
