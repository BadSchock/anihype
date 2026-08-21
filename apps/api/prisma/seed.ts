import {
  AnimeSeason,
  AnimeStatus,
  EpisodeStatus,
  HypeTransactionReason,
  PrismaClient,
  RoleCode,
} from '@prisma/client';
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
    // Achievement badges (ANI-10)
    {
      slug: 'first-comment',
      name: 'Primeiro Comentário',
      description: 'Publicou o primeiro comentário na comunidade',
      rarityColor: '#22C55E',
    },
    {
      slug: 'first-rating',
      name: 'Primeira Nota',
      description: 'Avaliou o primeiro anime no Hypômetro',
      rarityColor: '#F59E0B',
    },
    {
      slug: 'critic-on-duty',
      name: 'Crítico de Plantão',
      description: 'Escreveu 10 reviews junto com a nota',
      rarityColor: '#EF4444',
    },
    {
      slug: 'hyped',
      name: 'Hypado',
      description: 'Alcançou 500 Hype XP',
      rarityColor: '#A855F7',
    },
    {
      slug: 'marathoner',
      name: 'Maratonista',
      description: 'Seguiu 10 animes diferentes',
      rarityColor: '#3B82F6',
    },
    {
      slug: 'networker',
      name: 'Conexão',
      description: 'Seguiu 10 usuários da comunidade',
      rarityColor: '#06B6D4',
    },
    {
      slug: 'community-voice',
      name: 'Voz da Comunidade',
      description: 'Recebeu 50 likes em comentários',
      rarityColor: '#EC4899',
    },
    {
      slug: 'og',
      name: 'OG',
      description: 'Entre os 100 primeiros usuários do AniHype',
      rarityColor: '#EAB308',
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

/** Demo local: 10 users + Hypômetro em até 20 animes (para ranking / UI). */
const DEMO_USERS = [
  { username: 'sakura_fan', displayName: 'Sakura', email: 'sakura@demo.anihype.local' },
  { username: 'gojo_sensei', displayName: 'Gojo', email: 'gojo@demo.anihype.local' },
  { username: 'levi_ackerman', displayName: 'Levi', email: 'levi@demo.anihype.local' },
  { username: 'mikasa_prot', displayName: 'Mikasa', email: 'mikasa@demo.anihype.local' },
  { username: 'luffy_hype', displayName: 'Luffy', email: 'luffy@demo.anihype.local' },
  { username: 'nezuko_chan', displayName: 'Nezuko', email: 'nezuko@demo.anihype.local' },
  { username: 'killua_z', displayName: 'Killua', email: 'killua@demo.anihype.local' },
  { username: 'asuka_lang', displayName: 'Asuka', email: 'asuka@demo.anihype.local' },
  { username: 'spike_cow', displayName: 'Spike', email: 'spike@demo.anihype.local' },
  { username: 'violet_e', displayName: 'Violet', email: 'violet@demo.anihype.local' },
] as const;

const DEMO_PASSWORD = 'Demo1234!';

const DEMO_ANIMES = [
  {
    slug: 'demo-frieren',
    titleRomaji: 'Sousou no Frieren',
    titleEnglish: 'Frieren: Beyond Journey\'s End',
    status: AnimeStatus.FINISHED,
    season: AnimeSeason.FALL,
    seasonYear: 2023,
    popularityScore: 9900,
    coverImageUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx154587-JgZ016GIntkY.jpg',
  },
  {
    slug: 'demo-jujutsu-kaisen',
    titleRomaji: 'Jujutsu Kaisen',
    titleEnglish: 'Jujutsu Kaisen',
    status: AnimeStatus.AIRING,
    season: AnimeSeason.FALL,
    seasonYear: 2023,
    popularityScore: 9800,
    coverImageUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx113415-bYWSx1YgO97C.jpg',
  },
  {
    slug: 'demo-dandadan',
    titleRomaji: 'Dandadan',
    titleEnglish: 'Dandadan',
    status: AnimeStatus.AIRING,
    season: AnimeSeason.FALL,
    seasonYear: 2024,
    popularityScore: 9700,
    coverImageUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx171018-4Apiwd7qnrSH.jpg',
  },
  {
    slug: 'demo-solo-leveling',
    titleRomaji: 'Ore dake Level Up na Ken',
    titleEnglish: 'Solo Leveling',
    status: AnimeStatus.FINISHED,
    season: AnimeSeason.WINTER,
    seasonYear: 2024,
    popularityScore: 9600,
    coverImageUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx151807-5Oj5Fxg832Bg.jpg',
  },
  {
    slug: 'demo-spy-x-family',
    titleRomaji: 'Spy x Family',
    titleEnglish: 'Spy x Family',
    status: AnimeStatus.AIRING,
    season: AnimeSeason.SPRING,
    seasonYear: 2022,
    popularityScore: 9500,
    coverImageUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx140960-5FZLKN6P267F.jpg',
  },
] as const;

const DEMO_EPISODES_PER_ANIME = 4;

const DEMO_COMMENTS = [
  'Episódio insano! Animação de outro nível.',
  'Esse plot twist pegou todo mundo de surpresa.',
  'Hypômetro merecido — nota 9 fácil.',
  'Alguém mais chorou nessa cena?',
  'Melhor episódio da temporada até agora.',
  'Ritmo perfeito, sem filler.',
  'Personagem principal evoluiu demais aqui.',
  'Trilha sonora elevou tudo.',
  'Sem spoiler: final deixou hype pro próximo.',
  'Comentário demo — comunidade ativa no ranking.',
] as const;

const DEMO_REVIEWS = [
  'Animação impecável e trilha sonora que eleva cada cena.',
  'História engaja do começo ao fim — Hypômetro alto com razão.',
  'Personagens memoráveis, mas o ritmo oscila no meio.',
  'Vale cada nota. Comunidade precisa ver isso.',
  'Bom, porém esperava mais do arco final.',
  null,
  null,
  'Review curta: hype garantido.',
  null,
  'Um dos melhores da temporada na minha opinião.',
] as const;

function computeFinalScore(scores: {
  animation: number;
  story: number;
  characters: number;
  sound: number;
  hype: number;
}): number {
  return (
    (scores.animation + scores.story + scores.characters + scores.sound + scores.hype * 2) /
    6
  );
}

/** Deterministic 1–10 score from seeds (stable across re-runs). */
function demoScore(userIndex: number, animeIndex: number, dim: number): number {
  const n = (userIndex * 17 + animeIndex * 31 + dim * 13) % 10;
  // Bias toward mid-high so ranking looks lively (4–10)
  return Math.min(10, Math.max(4, n + 4));
}

function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(12, 0, 0, 0);
  return date;
}

async function syncProfileHypeLevel(userId: number, hypeXp: number): Promise<void> {
  const level = await prisma.hypeLevel.findFirst({
    where: { minXp: { lte: hypeXp } },
    orderBy: { minXp: 'desc' },
  });

  await prisma.userProfile.update({
    where: { userId },
    data: {
      hypeXp,
      ...(level ? { hypeLevelId: level.id } : {}),
    },
  });
}

/** Cria catálogo mínimo quando o banco ainda não tem animes (ex.: antes do sync). */
async function seedDemoCatalogIfEmpty(): Promise<void> {
  const existing = await prisma.anime.count({ where: { deletedAt: null } });
  if (existing > 0) {
    console.log(`[seed] Demo catalog SKIP — ${existing} anime(s) já no banco`);
    return;
  }

  for (const row of DEMO_ANIMES) {
    const anime = await prisma.anime.create({
      data: {
        slug: row.slug,
        titleRomaji: row.titleRomaji,
        titleEnglish: row.titleEnglish,
        status: row.status,
        season: row.season,
        seasonYear: row.seasonYear,
        popularityScore: row.popularityScore,
        coverImageUrl: row.coverImageUrl,
        episodeCount: DEMO_EPISODES_PER_ANIME,
      },
    });

    for (let ep = 1; ep <= DEMO_EPISODES_PER_ANIME; ep++) {
      await prisma.episode.create({
        data: {
          animeId: anime.id,
          slug: `${row.slug}-ep-${ep}`,
          number: ep,
          title: `Episódio ${ep}`,
          status: EpisodeStatus.AIRED,
          airDate: daysAgo(30 - ep * 3),
          airTimeUtc: daysAgo(30 - ep * 3),
        },
      });
    }
  }

  console.log(
    `[seed] Demo catalog OK → ${DEMO_ANIMES.length} animes, ${DEMO_ANIMES.length * DEMO_EPISODES_PER_ANIME} episódios`,
  );
}

async function recalculateAnimeAggregates(animeId: number): Promise<void> {
  const agg = await prisma.animeRating.aggregate({
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

  const avg = agg._avg;
  await prisma.anime.update({
    where: { id: animeId },
    data: {
      ratingCount: agg._count.id,
      ratingAverage: avg.finalScore != null ? Number(avg.finalScore.toFixed(2)) : null,
      ratingAnimation: avg.animation != null ? Number(avg.animation.toFixed(2)) : null,
      ratingStory: avg.story != null ? Number(avg.story.toFixed(2)) : null,
      ratingCharacters: avg.characters != null ? Number(avg.characters.toFixed(2)) : null,
      ratingSound: avg.sound != null ? Number(avg.sound.toFixed(2)) : null,
      ratingHype: avg.hype != null ? Number(avg.hype.toFixed(2)) : null,
    },
  });
}

async function seedDemoUsers(): Promise<number[]> {
  const userRole = await prisma.role.findUnique({ where: { code: RoleCode.USER } });
  if (!userRole) throw new Error('Role USER não encontrada');

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, BCRYPT_ROUNDS);
  const userIds: number[] = [];

  for (const demo of DEMO_USERS) {
    const email = demo.email.toLowerCase();
    const username = demo.username.toLowerCase();

    const user = await prisma.user.upsert({
      where: { email },
      create: {
        email,
        username,
        passwordHash,
        displayName: demo.displayName,
        emailVerified: true,
        emailVerifiedAt: new Date(),
        roles: { create: [{ roleId: userRole.id }] },
        profile: { create: {} },
      },
      update: {
        passwordHash,
        displayName: demo.displayName,
        emailVerified: true,
      },
    });

    await prisma.userProfile.upsert({
      where: { userId: user.id },
      create: { userId: user.id, hypeXp: 0 },
      update: {},
    });

    userIds.push(user.id);
  }

  console.log(
    `[seed] Demo users OK → ${userIds.length} contas (senha: ${DEMO_PASSWORD})`,
  );
  return userIds;
}

async function seedDemoHypometro(userIds: number[]): Promise<void> {
  const animes = await prisma.anime.findMany({
    where: { deletedAt: null },
    orderBy: [{ popularityScore: 'desc' }, { id: 'asc' }],
    take: 20,
    select: { id: true },
  });

  if (animes.length === 0) {
    console.log('[seed] Demo Hypômetro SKIP — nenhum anime no banco');
    return;
  }

  let ratingCount = 0;
  for (let a = 0; a < animes.length; a++) {
    const anime = animes[a]!;
    for (let u = 0; u < userIds.length; u++) {
      const userId = userIds[u]!;
      const scores = {
        animation: demoScore(u, a, 1),
        story: demoScore(u, a, 2),
        characters: demoScore(u, a, 3),
        sound: demoScore(u, a, 4),
        hype: demoScore(u, a, 5),
      };
      const finalScore = Number(computeFinalScore(scores).toFixed(2));
      const reviewText = DEMO_REVIEWS[(u + a) % DEMO_REVIEWS.length] ?? null;

      await prisma.animeRating.upsert({
        where: { userId_animeId: { userId, animeId: anime.id } },
        create: {
          userId,
          animeId: anime.id,
          ...scores,
          finalScore,
          reviewText,
          containsSpoiler: false,
        },
        update: {
          ...scores,
          finalScore,
          reviewText,
          deletedAt: null,
        },
      });
      ratingCount += 1;
    }
    await recalculateAnimeAggregates(anime.id);
  }

  console.log(
    `[seed] Demo Hypômetro OK → ${animes.length} animes, ${ratingCount} ratings (10+ por anime)`,
  );
}

/** Comentários + Hype XP com datas variadas (ranking Membros: semana / mês / all). */
async function seedDemoCommunity(userIds: number[]): Promise<void> {
  const episodes = await prisma.episode.findMany({
    where: { deletedAt: null },
    orderBy: [{ airTimeUtc: 'desc' }, { id: 'asc' }],
    take: 24,
    select: { id: true, number: true, animeId: true },
  });

  if (episodes.length === 0) {
    console.log('[seed] Demo community SKIP — sem episódios');
    return;
  }

  await prisma.commentLike.deleteMany({
    where: { comment: { userId: { in: userIds } } },
  });
  await prisma.comment.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.hypeTransaction.deleteMany({ where: { userId: { in: userIds } } });

  let commentCount = 0;
  let txCount = 0;

  for (let i = 0; i < userIds.length; i++) {
    const userId = userIds[i]!;
    const commentsForUser = 2 + (i % 3);

    for (let c = 0; c < commentsForUser; c++) {
      const episode = episodes[(i + c) % episodes.length]!;
      const daysBack = 1 + ((i + c) % 6); // última semana
      const createdAt = daysAgo(daysBack);
      const content = DEMO_COMMENTS[(i + c) % DEMO_COMMENTS.length]!;

      const comment = await prisma.comment.create({
        data: {
          userId,
          episodeId: episode.id,
          content,
          isSpoiler: c === 0 && i % 4 === 0,
          createdAt,
        },
      });
      commentCount += 1;

      await prisma.hypeTransaction.create({
        data: {
          userId,
          reason: HypeTransactionReason.COMMENT_POSTED,
          referenceId: comment.id,
          deltaPoints: 5,
          createdAt,
        },
      });
      txCount += 1;

      const likerId = userIds[(i + 1) % userIds.length]!;
      if (likerId !== userId) {
        await prisma.commentLike.create({
          data: { userId: likerId, commentId: comment.id },
        });
        await prisma.hypeTransaction.create({
          data: {
            userId,
            reason: HypeTransactionReason.LIKE_RECEIVED,
            referenceId: comment.id,
            deltaPoints: 2,
            createdAt: daysAgo(Math.max(1, daysBack - 1)),
          },
        });
        txCount += 1;
      }
    }

    // XP extra no mês (fora da janela de 7 dias) para testar filtro "Esse mês"
    if (i % 2 === 0) {
      await prisma.hypeTransaction.create({
        data: {
          userId,
          reason: HypeTransactionReason.DAILY_LOGIN,
          deltaPoints: 10,
          createdAt: daysAgo(12 + (i % 10)),
        },
      });
      txCount += 1;
    }

    const ratings = await prisma.animeRating.findMany({
      where: { userId, deletedAt: null },
      take: 3,
      select: { id: true },
    });

    for (const rating of ratings) {
      const existing = await prisma.hypeTransaction.findFirst({
        where: {
          userId,
          reason: HypeTransactionReason.RATING_POSTED,
          referenceId: rating.id,
        },
      });
      if (existing) continue;

      await prisma.hypeTransaction.create({
        data: {
          userId,
          reason: HypeTransactionReason.RATING_POSTED,
          referenceId: rating.id,
          deltaPoints: 10,
          createdAt: daysAgo(3 + (i % 4)),
        },
      });
      txCount += 1;
    }

    const totalXp = await prisma.hypeTransaction.aggregate({
      where: { userId },
      _sum: { deltaPoints: true },
    });
    const hypeXp = totalXp._sum.deltaPoints ?? 0;
    await syncProfileHypeLevel(userId, hypeXp);
  }

  console.log(
    `[seed] Demo community OK → ${commentCount} comentários, ${txCount} transações de Hype XP`,
  );
}

async function seedDemoRanking(): Promise<void> {
  await seedDemoCatalogIfEmpty();
  const userIds = await seedDemoUsers();
  await seedDemoHypometro(userIds);
  await seedDemoCommunity(userIds);
}

async function main(): Promise<void> {
  const demoOnly = process.env.SEED_DEMO_ONLY === '1' || process.argv.includes('--demo');

  if (demoOnly) {
    await seedDemoRanking();
    return;
  }

  await seedRoles();
  console.log('[seed] Roles OK');
  await seedBadges();
  console.log('[seed] Badges OK');
  await seedHypeLevels();
  console.log('[seed] Hype levels OK');
  await seedDevAdminUser();
  await seedDemoRanking();
}

main()
  .catch((err: unknown) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
