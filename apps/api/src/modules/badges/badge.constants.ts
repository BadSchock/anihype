/** Achievement badges (not role/staff badges). */
export const ACHIEVEMENT_BADGES = [
  {
    slug: 'first-comment',
    name: 'Primeiro Comentário',
    description: 'Publicou o primeiro comentário na comunidade',
    rarityColor: '#22C55E',
    target: 1,
  },
  {
    slug: 'first-rating',
    name: 'Primeira Nota',
    description: 'Avaliou o primeiro anime no Hypômetro',
    rarityColor: '#F59E0B',
    target: 1,
  },
  {
    slug: 'critic-on-duty',
    name: 'Crítico de Plantão',
    description: 'Escreveu 10 reviews junto com a nota',
    rarityColor: '#EF4444',
    target: 10,
  },
  {
    slug: 'hyped',
    name: 'Hypado',
    description: 'Alcançou 500 Hype XP',
    rarityColor: '#A855F7',
    target: 500,
  },
  {
    slug: 'marathoner',
    name: 'Maratonista',
    description: 'Seguiu 10 animes diferentes',
    rarityColor: '#3B82F6',
    target: 10,
  },
  {
    slug: 'networker',
    name: 'Conexão',
    description: 'Seguiu 10 usuários da comunidade',
    rarityColor: '#06B6D4',
    target: 10,
  },
  {
    slug: 'community-voice',
    name: 'Voz da Comunidade',
    description: 'Recebeu 50 likes em comentários',
    rarityColor: '#EC4899',
    target: 50,
  },
  {
    slug: 'og',
    name: 'OG',
    description: 'Entre os 100 primeiros usuários do AniHype',
    rarityColor: '#EAB308',
    target: 1,
  },
] as const;

export type AchievementSlug = (typeof ACHIEVEMENT_BADGES)[number]['slug'];

export const ACHIEVEMENT_SLUGS: AchievementSlug[] = ACHIEVEMENT_BADGES.map((b) => b.slug);

export const OG_MAX_USER_ID = 100;

export type BadgeEvent =
  | 'comment_created'
  | 'rating_upserted'
  | 'anime_followed'
  | 'user_followed'
  | 'like_received'
  | 'xp_awarded'
  | 'user_registered';
