import { BadRequestException, Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { User, RoleCode } from '@prisma/client';
import sharp from 'sharp';
import { randomUUID } from 'crypto';

import { PrismaService } from '../../prisma/prisma.service';
import { UsersRepository } from './users.repository';
import { BadgesService } from '../badges/badges.service';
import { AvatarStorageService } from './avatar-storage.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { censorText } from '../../common/moderation/censor-text';
import { detectImageMime } from '../../common/files/image-signature.util';
import { canEquipProfileBanner, resolveProfileBanner } from './profile-banners';
import { isSettableOnboardingState, resolveOnboardingState } from './onboarding';

export interface CreateUserInput {
  email: string;
  username: string;
  passwordHash: string;
  displayName?: string;
}

export interface UserWithRoles extends User {
  roles: { role: { code: RoleCode } }[];
}

/** Formato retornado por PATCH /users/me e POST /users/me/avatar. */
export interface MeProfileDto {
  id: number;
  email: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  profileBanner: string;
  onboardingState: 'pending' | 'later' | 'done';
  roles: string[];
}

const AVATAR_MAX_DIMENSION = 512;
const AVATAR_WEBP_QUALITY = 85;

@Injectable()
export class UsersService {
  constructor(
    private readonly repo: UsersRepository,
    private readonly prisma: PrismaService,
    private readonly badgesService: BadgesService,
    private readonly avatarStorage: AvatarStorageService,
  ) {}

  async findById(id: number): Promise<User | null> {
    return this.repo.findById(id);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repo.findByEmail(email);
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.repo.findByUsername(username);
  }

  async findWithRoles(id: number) {
    return this.repo.findWithRoles(id);
  }

  async create(input: CreateUserInput): Promise<User> {
    const [existingEmail, existingUsername] = await Promise.all([
      this.repo.findByEmail(input.email),
      this.repo.findByUsername(input.username),
    ]);

    if (existingEmail) throw new ConflictException('Email já cadastrado');
    if (existingUsername) throw new ConflictException('Username já em uso');

    const userRole = await this.prisma.role.findUnique({
      where: { code: RoleCode.USER },
    });

    const user = await this.repo.create({
      email: input.email.toLowerCase(),
      username: input.username.toLowerCase(),
      passwordHash: input.passwordHash,
      displayName: input.displayName ?? input.username,
      roles: {
        create: userRole ? [{ role: { connect: { id: userRole.id } } }] : [],
      },
      profile: {
        create: { onboardingState: 'pending' },
      },
    });

    void this.badgesService.awardIfEligible(user.id, 'user_registered');

    return user;
  }

  async assertExists(id: number): Promise<User> {
    const user = await this.repo.findById(id);
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user;
  }

  async updateLastLogin(id: number): Promise<void> {
    await this.repo.update(id, { lastLoginAt: new Date() });
  }

  async getPublicProfile(username: string) {
    const user = await this.prisma.user.findFirst({
      where: { username: username.toLowerCase(), deletedAt: null },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        createdAt: true,
        profile: {
          select: {
            profileBanner: true,
            equippedBadge: {
              select: {
                id: true,
                slug: true,
                name: true,
                rarityColor: true,
                iconUrl: true,
              },
            },
          },
        },
      },
    });
    if (!user) return null;

    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      createdAt: user.createdAt,
      profileBanner: resolveProfileBanner(user.profile?.profileBanner),
      equippedBadge: user.profile?.equippedBadge ?? null,
    };
  }

  // ─── Edição do próprio perfil ────────────────────────────────────────────
  //
  // Username NÃO é editável nesta versão: o perfil público usa /u/[username]
  // e ainda não existe histórico/redirect de usernames antigos.

  /** PATCH /users/me — displayName, bio e fundo oficial. Nunca username, avatar, email ou CSS. */
  async updateProfile(userId: number, dto: UpdateUserDto): Promise<MeProfileDto> {
    await this.assertExists(userId);

    const data: { displayName?: string | null; bio?: string | null } = {};

    if (dto.displayName !== undefined) {
      const trimmed = dto.displayName.trim();
      data.displayName = trimmed.length > 0 ? trimmed : null;
    }

    if (dto.bio !== undefined) {
      const trimmed = dto.bio.trim();
      data.bio = trimmed.length > 0 ? censorText(trimmed).text : null;
    }

    if (Object.keys(data).length > 0) {
      await this.repo.update(userId, data);
    }

    if (dto.profileBanner !== undefined) {
      if (!canEquipProfileBanner(dto.profileBanner)) {
        throw new BadRequestException('Fundo de perfil inválido.');
      }
      await this.prisma.userProfile.upsert({
        where: { userId },
        create: { userId, profileBanner: dto.profileBanner },
        update: { profileBanner: dto.profileBanner },
      });
    }

    const updated = await this.assertExists(userId);
    return this.toMeShape(updated);
  }

  /** Pular (later) ou concluir (done). Não volta para pending. */
  async setOnboardingState(userId: number, state: string) {
    await this.assertExists(userId);
    if (!isSettableOnboardingState(state)) {
      throw new BadRequestException('Estado da apresentação inválido.');
    }

    const profile = await this.prisma.userProfile.upsert({
      where: { userId },
      create: { userId, onboardingState: state },
      update: { onboardingState: state },
      select: { onboardingState: true },
    });

    return { onboardingState: resolveOnboardingState(profile.onboardingState) };
  }

  /**
   * POST /users/me/avatar — recebe o buffer já validado (mimetype declarado)
   * pelo ParseFilePipe do controller. Aqui fazemos a validação forte:
   * assinatura binária real + decodificação via sharp (rejeita qualquer
   * payload que não seja de fato uma imagem, mesmo com header correto).
   */
  async updateAvatar(userId: number, file: Express.Multer.File): Promise<MeProfileDto> {
    const current = await this.assertExists(userId);

    const detected = detectImageMime(file.buffer);
    if (!detected) {
      throw new BadRequestException(
        'Arquivo inválido. Envie uma imagem JPEG, PNG ou WebP (SVG não é aceito).',
      );
    }

    let processed: Buffer;
    try {
      processed = await sharp(file.buffer)
        .rotate() // corrige orientação EXIF
        .resize(AVATAR_MAX_DIMENSION, AVATAR_MAX_DIMENSION, {
          fit: 'cover',
          position: 'attention',
        })
        .webp({ quality: AVATAR_WEBP_QUALITY })
        .toBuffer();
    } catch {
      throw new BadRequestException('Não foi possível processar a imagem enviada.');
    }

    // Chave única e segura — nunca deriva do nome original do arquivo (evita
    // path traversal e colisões); extensão fixa .webp (sempre reprocessado).
    const key = `avatars/${userId}/${randomUUID()}.webp`;
    const url = await this.avatarStorage.upload(key, processed, 'image/webp');

    const oldKey = this.avatarStorage.extractManagedKey(current.avatarUrl);

    const updated = await this.repo.update(userId, { avatarUrl: url });

    // Best-effort: só remove o arquivo anterior se ele estiver na nossa pasta.
    // Nunca apaga URL externa que não tenhamos gravado.
    if (oldKey && oldKey !== key) {
      void this.avatarStorage.delete(oldKey);
    }

    return this.toMeShape(updated);
  }

  private async toMeShape(user: User): Promise<MeProfileDto> {
    const withRoles = await this.repo.findWithRoles(user.id);
    const roles = (withRoles?.roles ?? []).map((r) => r.role.code as string);

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      profileBanner: resolveProfileBanner(withRoles?.profile?.profileBanner),
      onboardingState: resolveOnboardingState(withRoles?.profile?.onboardingState),
      roles,
    };
  }
}
