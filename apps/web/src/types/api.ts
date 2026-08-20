// Tipos que espelham as respostas da API

export type AnimeStatus = 'AIRING' | 'FINISHED' | 'NOT_YET_AIRED' | 'CANCELLED' | 'HIATUS';
export type AnimeFormat = 'TV' | 'MOVIE' | 'OVA' | 'ONA' | 'SPECIAL' | 'MUSIC';
export type AnimeSeason = 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL';
export type EpisodeStatus = 'AIRED' | 'UPCOMING' | 'UNKNOWN';

export interface Genre {
  id: number;
  name: string;
  slug: string;
}

export interface Studio {
  id: number;
  name: string;
  role?: string | null;
}

export interface AnimeListItem {
  id: number;
  slug: string;
  titleRomaji: string;
  titleEnglish?: string | null;
  titleNative?: string | null;
  synopsis?: string | null;
  coverImageUrl?: string | null;
  bannerImageUrl?: string | null;
  status: AnimeStatus;
  format?: AnimeFormat | null;
  season?: AnimeSeason | null;
  seasonYear?: number | null;
  episodeCount?: number | null;
  averageScore?: number | null;
  popularityScore?: number | null;
  genres: Genre[];
  studios: Studio[];
  // Scores da comunidade AniHype
  ratingCount?: number;
  ratingAverage?: number | null;
  ratingAnimation?: number | null;
  ratingStory?: number | null;
  ratingCharacters?: number | null;
  ratingSound?: number | null;
  ratingHype?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface RatingBadge {
  label: string;
  emoji: string;
}

export interface RatingDimensions {
  animation: number;
  story: number;
  characters: number;
  sound: number;
  hype: number;
}

export interface RatingAggregate {
  count: number;
  average: number;
  badge: RatingBadge | null;
  qualifiesForRanking: boolean;
  dimensions: RatingDimensions;
}

export interface ReviewUser {
  id: number;
  username: string;
  displayName?: string | null;
  equippedBadge?: EquippedBadge | null;
}

export interface AnimeReview {
  id: number;
  userId: number;
  animeId: number;
  animation: number;
  story: number;
  characters: number;
  sound: number;
  hype: number;
  finalScore: number;
  reviewText?: string | null;
  containsSpoiler: boolean;
  badge: RatingBadge;
  user: ReviewUser;
  createdAt: string;
  updatedAt: string;
}

export interface AnimeRatingResponse {
  aggregate: RatingAggregate;
  reviews: AnimeReview[];
  meta: PaginationMeta;
}

export interface MyRating {
  id: number;
  animation: number;
  story: number;
  characters: number;
  sound: number;
  hype: number;
  finalScore: number;
  reviewText?: string | null;
  containsSpoiler: boolean;
  badge: RatingBadge;
  awardedBadges?: AwardedBadge[];
}

export interface AnimeDetail extends AnimeListItem {
  trailerUrl?: string | null;
  episodeDuration?: number | null;
  isAdult: boolean;
  streamingLinks: StreamingLink[];
}

export interface StreamingPlatform {
  id: number;
  name: string;
  slug: string;
  homepageUrl?: string | null;
}

export interface StreamingLink {
  id: number;
  url: string;
  regionCode?: string | null;
  platform: StreamingPlatform;
}

export interface Episode {
  id: number;
  animeId: number;
  slug: string;
  number: number;
  title?: string | null;
  synopsis?: string | null;
  thumbnailUrl?: string | null;
  airDate?: string | null;
  airTimeUtc?: string | null;
  durationMinutes?: number | null;
  status: EpisodeStatus;
  scoreAverage?: number | null;
  commentCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface TrendingEpisode extends EpisodeWithAnime {
  recentCommentCount: number;
}

export interface HotComment {
  id: number;
  episodeId: number;
  author: CommentAuthor;
  parentId?: number | null;
  content: string;
  isSpoiler: boolean;
  likeCount: number;
  replyCount: number;
  createdAt: string;
  episode: {
    id: number;
    number: number;
    title?: string | null;
    anime: {
      id: number;
      slug: string;
      titleRomaji: string;
      titleEnglish: string | null;
      coverImageUrl: string | null;
    };
  };
}

export interface EpisodeWithAnime extends Episode {
  anime: {
    id: number;
    slug: string;
    titleRomaji: string;
    titleEnglish: string | null;
    coverImageUrl: string | null;
  };
}

export interface CalendarDay {
  date: string;
  episodes: EpisodeWithAnime[];
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface CommentAuthor {
  id: number;
  username: string;
  avatarUrl?: string | null;
  equippedBadge?: EquippedBadge | null;
}

export interface EquippedBadge {
  id: number;
  slug: string;
  name: string;
  rarityColor?: string | null;
  iconUrl?: string | null;
}

export interface BadgeProgress {
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

export interface UserBadgesResponse {
  badges: BadgeProgress[];
  equippedBadge: EquippedBadge | null;
}

export interface AwardedBadge {
  slug: string;
  name: string;
  rarityColor: string | null;
}

export interface Comment {
  id: number;
  episodeId: number;
  author: CommentAuthor;
  parentId?: number | null;
  content: string;
  isSpoiler: boolean;
  status: string;
  likeCount: number;
  replyCount: number;
  likedByMe: boolean;
  createdAt: string;
  updatedAt: string;
  editedAt?: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  roles: string[];
}

/** Resposta completa do POST /auth/login e /auth/register */
export interface AuthLoginResponse {
  user: AuthUser;
  tokens: AuthTokens;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  statusCode: number;
}

export interface TopAnimeAnime {
  id: number;
  slug: string;
  titleRomaji: string;
  titleEnglish?: string | null;
  coverImageUrl?: string | null;
  bannerImageUrl?: string | null;
  status: AnimeStatus;
  season?: AnimeSeason | null;
  seasonYear?: number | null;
  ratingAverage?: number | null;
}

export interface TopAnimeEntry {
  position: number;
  anime: TopAnimeAnime;
}

export interface SetTopAnimePayload {
  items: { animeId: number; position: number }[];
}

export interface FollowedAnimeEntry {
  followedAt: string;
  anime: TopAnimeAnime & { episodeCount?: number | null };
}

export interface AnimeFollowStatus {
  following: boolean;
}

export interface UserFollowStatus {
  following: boolean;
}

export interface SocialCounts {
  followerCount: number;
  followingCount: number;
}

export interface FollowedUserEntry {
  followedAt: string;
  user: {
    id: number;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    bio: string | null;
  };
}

export type FeedItemType = 'COMMENT' | 'RATING' | 'ANIME_FOLLOW';

export interface FeedItem {
  type: FeedItemType;
  createdAt: string;
  user: {
    id: number;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  comment?: {
    id: number;
    content: string;
    isSpoiler: boolean;
    episode: {
      number: number;
      title: string | null;
      anime: {
        slug: string;
        titleEnglish: string | null;
        titleRomaji: string;
        coverImageUrl: string | null;
      };
    };
  };
  rating?: {
    id: number;
    finalScore: number;
    reviewText: string | null;
    containsSpoiler: boolean;
    badge: RatingBadge;
    anime: {
      slug: string;
      titleEnglish: string | null;
      titleRomaji: string;
      coverImageUrl: string | null;
    };
  };
  animeFollow?: {
    anime: {
      slug: string;
      titleEnglish: string | null;
      titleRomaji: string;
      coverImageUrl: string | null;
    };
  };
}

export interface AppNotification {
  id: number;
  topic: string;
  body: string;
  payload: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationsResponse {
  data: AppNotification[];
  meta: PaginationMeta & { unreadCount: number };
}

export interface FeaturedReview {
  id: number;
  finalScore: number;
  reviewText: string | null;
  containsSpoiler: boolean;
  badge: RatingBadge;
  user: {
    id: number;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  anime: {
    slug: string;
    titleRomaji: string;
    titleEnglish: string | null;
    coverImageUrl: string | null;
  };
  createdAt: string;
}

export interface HypeLevelInfo {
  tierOrder: number;
  displayName: string;
  minXp: number;
}

export interface HypeStats {
  hypeXp: number;
  level: HypeLevelInfo | null;
  nextLevel: (HypeLevelInfo & { xpNeeded: number }) | null;
}

export interface SeasonalHighlight {
  id: number;
  animeId: number;
  title: string | null;
  subtitle: string | null;
  imageUrl: string | null;
  ctaLabel: string | null;
  destination: string | null;
  season: AnimeSeason | null;
  year: number | null;
  heroPosition: number;
  isFeatured: boolean;
  published: boolean;
  visibleFrom: string | null;
  visibleUntil: string | null;
  createdAt: string;
  updatedAt: string;
  anime: {
    id: number;
    slug: string;
    titleRomaji: string;
    titleEnglish: string | null;
    coverImageUrl: string | null;
    bannerImageUrl: string | null;
    synopsis: string | null;
    ratingAverage: number | null;
    ratingCount: number;
  };
}

export interface AnimeAdminEpisode {
  id: number;
  number: number;
  title?: string | null;
  airTimeUtc?: string | null;
  airDate?: string | null;
  thumbnailUrl?: string | null;
  status: EpisodeStatus;
}

export interface AnimeAdminData {
  id: number;
  slug: string;
  titleRomaji: string;
  titleEnglish?: string | null;
  coverImageUrl?: string | null;
  bannerImageUrl?: string | null;
  trailerUrl?: string | null;
  isLocked: boolean;
  streamingLinks: StreamingLink[];
  episodes: AnimeAdminEpisode[];
}

export interface UpdateAnimeAdminPayload {
  coverImageUrl?: string | null;
  bannerImageUrl?: string | null;
  trailerUrl?: string | null;
  isLocked?: boolean;
  streamingLinks?: Array<{ platformName: string; url: string; regionCode?: string }>;
}

export interface UpdateEpisodeAdminPayload {
  airTimeUtc?: string | null;
  title?: string | null;
  thumbnailUrl?: string | null;
}
