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
}

export interface AnimeDetail extends AnimeListItem {
  trailerUrl?: string | null;
  episodeDuration?: number | null;
  isAdult: boolean;
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
  createdAt: string;
  updatedAt: string;
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
