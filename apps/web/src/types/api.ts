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
  createdAt: string;
  updatedAt: string;
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
  userId: number;
  expiresIn: number;
}

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  avatarUrl?: string | null;
  roles: string[];
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  statusCode: number;
}
