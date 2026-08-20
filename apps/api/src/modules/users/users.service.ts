import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { User, RoleCode } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { UsersRepository } from './users.repository';
import { BadgesService } from '../badges/badges.service';

export interface CreateUserInput {
  email: string;
  username: string;
  passwordHash: string;
  displayName?: string;
}

export interface UserWithRoles extends User {
  roles: { role: { code: RoleCode } }[];
}

@Injectable()
export class UsersService {
  constructor(
    private readonly repo: UsersRepository,
    private readonly prisma: PrismaService,
    private readonly badgesService: BadgesService,
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
        create: {},
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
      equippedBadge: user.profile?.equippedBadge ?? null,
    };
  }
}
