import { PrismaClient, RoleCode } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const BCRYPT_ROUNDS = 12;

/** Conta admin de desenvolvimento — criada automaticamente no seed */
const DEV_ADMIN = {
  email: 'anihype@gmail.com',
  username: 'anihype',
  password: 'AniHype1$',
  displayName: 'AniHype Admin',
} as const;

async function seedRoles(): Promise<void> {
  const roles: { code: RoleCode; description: string }[] = [
    { code: RoleCode.USER, description: 'Usuário registrado na plataforma' },
    { code: RoleCode.PREMIUM, description: 'Assinatura premium ativa ou legado' },
    { code: RoleCode.MODERATOR, description: 'Moderação de conteúdo e reports' },
    { code: RoleCode.ADMIN, description: 'Administração da plataforma' },
    { code: RoleCode.SUPER_ADMIN, description: 'Acesso total ao painel administrativo' },
  ];

  for (const row of roles) {
    await prisma.role.upsert({
      where: { code: row.code },
      create: row,
      update: { description: row.description },
    });
  }
}

async function seedBadges(): Promise<void> {
  const badges = [
    {
      slug: 'beta-user',
      name: 'Beta User',
      description: 'Participante do período beta do AniHype',
      rarityColor: '#7C5CFF',
    },
    {
      slug: 'founder',
      name: 'Founder',
      description: 'Um dos primeiros usuários ou apoiadores iniciais',
      rarityColor: '#5B8CFF',
    },
    {
      slug: 'admin',
      name: 'Administrador',
      description: 'Equipe administrativa oficial',
      rarityColor: '#EF4444',
    },
    {
      slug: 'moderator',
      name: 'Moderador',
      description: 'Equipe de moderação',
      rarityColor: '#22C55E',
    },
  ];

  for (const b of badges) {
    await prisma.badge.upsert({
      where: { slug: b.slug },
      create: {
        slug: b.slug,
        name: b.name,
        description: b.description,
        rarityColor: b.rarityColor,
      },
      update: {
        name: b.name,
        description: b.description,
        rarityColor: b.rarityColor,
      },
    });
  }
}

async function seedHypeLevels(): Promise<void> {
  const tiers = [
    { tierOrder: 1, minXp: 0, displayName: 'Iniciante' },
    { tierOrder: 2, minXp: 100, displayName: 'Ativo' },
    { tierOrder: 3, minXp: 500, displayName: 'Hype' },
    { tierOrder: 4, minXp: 2000, displayName: 'Veterano' },
    { tierOrder: 5, minXp: 10000, displayName: 'Lenda AniHype' },
  ];

  for (const tier of tiers) {
    await prisma.hypeLevel.upsert({
      where: { tierOrder: tier.tierOrder },
      create: tier,
      update: {
        minXp: tier.minXp,
        displayName: tier.displayName,
      },
    });
  }
}

async function seedDevAdminUser(): Promise<void> {
  const passwordHash = await bcrypt.hash(DEV_ADMIN.password, BCRYPT_ROUNDS);

  const [userRole, adminRole] = await Promise.all([
    prisma.role.findUnique({ where: { code: RoleCode.USER } }),
    prisma.role.findUnique({ where: { code: RoleCode.ADMIN } }),
  ]);

  if (!userRole || !adminRole) {
    throw new Error('Roles USER/ADMIN não encontradas — execute seedRoles primeiro');
  }

  const email = DEV_ADMIN.email.toLowerCase();
  const username = DEV_ADMIN.username.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        passwordHash,
        displayName: DEV_ADMIN.displayName,
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });

    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: existing.id, roleId: userRole.id } },
      create: { userId: existing.id, roleId: userRole.id },
      update: {},
    });
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: existing.id, roleId: adminRole.id } },
      create: { userId: existing.id, roleId: adminRole.id },
      update: {},
    });
  } else {
    await prisma.user.create({
      data: {
        email,
        username,
        passwordHash,
        displayName: DEV_ADMIN.displayName,
        emailVerified: true,
        emailVerifiedAt: new Date(),
        roles: {
          create: [{ roleId: userRole.id }, { roleId: adminRole.id }],
        },
        profile: { create: {} },
      },
    });
  }

  console.log(`[seed] Admin dev OK → ${email} (username: ${username})`);
}

async function main(): Promise<void> {
  await seedRoles();
  console.log('[seed] Roles OK');
  await seedBadges();
  console.log('[seed] Badges OK');
  await seedHypeLevels();
  console.log('[seed] Hype levels OK');
  await seedDevAdminUser();
}

main()
  .catch((err: unknown) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
