import type {
  AnimeDetail,
  AnimeAdminData,
  AnimeListItem,
  AnimeRatingResponse,
  AuthLoginResponse,
  AuthTokens,
  AuthUser,
  CalendarDay,
  Comment,
  HotComment,
  TrendingEpisode,
  EpisodeWithAnime,
  MyRating,
  PaginatedResponse,
  SeasonalHighlight,
  SetTopAnimePayload,
  TopAnimeEntry,
  UpdateAnimeAdminPayload,
  UpdateEpisodeAdminPayload,
  UserFollowStatus,
  SocialCounts,
  FollowedUserEntry,
  FeedItem,
  NotificationsResponse,
  FeaturedReview,
  FollowedAnimeEntry,
  AnimeFollowStatus,
  HypeStats,
  EquippedBadge,
  UserBadgesResponse,
  AnimeRankingResponse,
  UserRankingResponse,
  UserRankingPeriod,
} from '@/types/api';
import { useAuthStore } from '@/stores/auth.store';

const BASE = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001/api/v1';

type RequestOptions = RequestInit & {
  token?: string;
  skipAuth?: boolean;
  _retry?: boolean;
};

function unwrapApiResponse<T>(json: unknown): T {
  if (typeof json === 'object' && json !== null && 'data' in json) {
    return (json as { data: T }).data;
  }
  return json as T;
}

async function refreshTokensRaw(userId: number, refreshToken: string): Promise<AuthTokens> {
  const res = await fetch(`${BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, refreshToken }),
  });

  if (!res.ok) {
    throw new Error('Refresh token inválido ou expirado');
  }

  const json = (await res.json()) as unknown;
  return unwrapApiResponse<AuthTokens>(json);
}

async function tryRefreshSession(): Promise<string | null> {
  const state = useAuthStore.getState();
  if (!state.refreshToken || !state.user) return null;

  const tokens = await refreshTokensRaw(state.user.id, state.refreshToken);
  state.setAuth(state.user, tokens.accessToken, tokens.refreshToken);
  return tokens.accessToken;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { token: explicitToken, skipAuth, _retry, ...rest } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(rest.headers as Record<string, string>),
  };

  const token =
    explicitToken ?? (!skipAuth ? (useAuthStore.getState().accessToken ?? undefined) : undefined);
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...rest, headers });

  if (res.status === 401 && !skipAuth && !_retry) {
    try {
      const newToken = await tryRefreshSession();
      if (newToken) {
        return request<T>(path, { ...options, token: newToken, _retry: true });
      }
    } catch {
      useAuthStore.getState().logout();
      throw new Error('Sessão expirada. Faça login novamente.');
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Erro desconhecido' }));
    const message = (err as { message?: string | string[] }).message;
    throw new Error(Array.isArray(message) ? message.join(', ') : (message ?? 'Request failed'));
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const text = await res.text();
  if (!text) {
    return undefined as T;
  }

  return unwrapApiResponse<T>(JSON.parse(text) as unknown);
}

// ─── Anime ──────────────────────────────────────────────────────────────────

export function getAnimeList(params: Record<string, string | number | undefined> = {}) {
  const qs = new URLSearchParams(
    Object.fromEntries(
      Object.entries(params)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)]),
    ),
  ).toString();
  return request<PaginatedResponse<AnimeListItem>>(`/anime${qs ? `?${qs}` : ''}`, {
    skipAuth: true,
  });
}

export function getAnimeBySlug(slug: string) {
  return request<AnimeDetail>(`/anime/${slug}`, { skipAuth: true });
}

// ─── Episodes ───────────────────────────────────────────────────────────────

export function getTodayReleases() {
  return request<EpisodeWithAnime[]>('/episodes/today', { skipAuth: true });
}

export function getWeeklyCalendar(days = 7) {
  return request<CalendarDay[]>(`/episodes/calendar?days=${days}`, { skipAuth: true });
}

export function getRecentReleases(days = 7) {
  return request<CalendarDay[]>(`/episodes/recent?days=${days}`, { skipAuth: true });
}

export function getTrendingEpisodes(days = 7, limit = 12) {
  return request<TrendingEpisode[]>(`/episodes/trending?days=${days}&limit=${limit}`, {
    skipAuth: true,
  });
}

export function getHotComments(limit = 8, days = 7) {
  return request<HotComment[]>(`/comments/hot?limit=${limit}&days=${days}`, { skipAuth: true });
}

export function getAnimeEpisodes(animeId: number, page = 1, limit = 24) {
  return request<PaginatedResponse<EpisodeWithAnime>>(
    `/anime/${animeId}/episodes?page=${page}&limit=${limit}`,
    { skipAuth: true },
  );
}

export function getEpisodeByNumber(animeId: number, number: number) {
  return request<EpisodeWithAnime>(`/anime/${animeId}/episodes/number/${number}`, {
    skipAuth: true,
  });
}

// ─── Comments ───────────────────────────────────────────────────────────────

export function getEpisodeComments(
  episodeId: number,
  page = 1,
  limit = 20,
  options?: { token?: string; rootOnly?: boolean; parentId?: number },
) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  if (options?.parentId) {
    params.set('parentId', String(options.parentId));
  } else if (options?.rootOnly !== false) {
    params.set('rootOnly', 'true');
  }

  return request<PaginatedResponse<Comment>>(
    `/comments/episode/${episodeId}?${params.toString()}`,
    { token: options?.token },
  );
}

export function createComment(
  body: { episodeId: number; content: string; parentId?: number; isSpoiler?: boolean },
  token: string,
) {
  return request<Comment>('/comments', {
    method: 'POST',
    body: JSON.stringify(body),
    token,
  });
}

export function toggleCommentLike(commentId: number, token: string) {
  return request<{ liked: boolean; likeCount: number }>(`/comments/${commentId}/like`, {
    method: 'POST',
    token,
  });
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export function login(identifier: string, password: string) {
  return request<AuthLoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier, password }),
    skipAuth: true,
  });
}

export function register(username: string, email: string, password: string) {
  return request<AuthLoginResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, email, password }),
    skipAuth: true,
  });
}

export function getMe(token?: string) {
  return request<AuthUser>('/auth/me', { token });
}

export function refreshTokens(userId: number, refreshToken: string) {
  return refreshTokensRaw(userId, refreshToken);
}

export async function logout(accessToken: string, refreshToken: string) {
  return request<{ message: string }>('/auth/logout', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
    token: accessToken,
  });
}

/** Restaura sessão após reload — usado no AuthProvider */
export async function bootstrapAuthSession(): Promise<void> {
  const state = useAuthStore.getState();

  if (!state.isAuthenticated || !state.user || !state.refreshToken) {
    state.setAuthReady(true);
    return;
  }

  try {
    const tokens = await refreshTokensRaw(state.user.id, state.refreshToken);
    const me = await request<AuthUser>('/auth/me', { token: tokens.accessToken });
    state.setAuth(me, tokens.accessToken, tokens.refreshToken);
  } catch {
    state.logout();
  } finally {
    state.setAuthReady(true);
  }
}

// ─── Users (perfil público) ──────────────────────────────────────────────────

export interface PublicProfile {
  id: number;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: string;
  equippedBadge?: EquippedBadge | null;
}

export function getPublicProfile(username: string) {
  return request<PublicProfile>(`/users/${username}`, { skipAuth: true });
}

// ─── Badges / Conquistas ─────────────────────────────────────────────────────

export function getUserBadges(username: string) {
  return request<UserBadgesResponse>(`/users/${username}/badges`, { skipAuth: true });
}

export function equipBadge(badgeId: number | null, token?: string) {
  return request<{ equippedBadge: EquippedBadge | null }>(`/users/me/badges/equipped`, {
    method: 'PATCH',
    body: JSON.stringify({ badgeId }),
    token,
  });
}

// ─── Ratings ─────────────────────────────────────────────────────────────────

export interface CreateRatingPayload {
  animation: number;
  story: number;
  characters: number;
  sound: number;
  hype: number;
  reviewText?: string;
  containsSpoiler?: boolean;
}

export function getAnimeRatings(slug: string, page = 1) {
  return request<AnimeRatingResponse>(`/anime/${slug}/ratings?page=${page}`, { skipAuth: true });
}

export function getMyAnimeRating(slug: string, token?: string) {
  return request<MyRating | null>(`/anime/${slug}/ratings/me`, { token });
}

export function upsertAnimeRating(slug: string, payload: CreateRatingPayload, token?: string) {
  return request<MyRating>(`/anime/${slug}/ratings`, {
    method: 'POST',
    body: JSON.stringify(payload),
    token,
  });
}

export function deleteAnimeRating(slug: string, token?: string) {
  return request<{ message: string }>(`/anime/${slug}/ratings/me`, {
    method: 'DELETE',
    token,
  });
}

// ─── Highlights ──────────────────────────────────────────────────────────────

export function getHeroHighlight() {
  return request<SeasonalHighlight | null>('/highlights/hero', { skipAuth: true });
}

export function getHighlights(token?: string) {
  return request<SeasonalHighlight[]>('/highlights', { token });
}

export function createHighlight(
  payload: {
    animeId: number;
    title?: string;
    subtitle?: string;
    ctaLabel?: string;
    destination?: string;
  },
  token?: string,
) {
  return request<SeasonalHighlight>('/highlights', {
    method: 'POST',
    body: JSON.stringify(payload),
    token,
  });
}

export function deleteHighlight(id: number, token?: string) {
  return request<{ message: string }>(`/highlights/${id}`, {
    method: 'DELETE',
    token,
  });
}

// ─── Top Anime ────────────────────────────────────────────────────────────────

export function getUserTopAnime(username: string) {
  return request<TopAnimeEntry[]>(`/users/${username}/top-anime`, { skipAuth: true });
}

export function setMyTopAnime(payload: SetTopAnimePayload) {
  return request<TopAnimeEntry[]>('/users/me/top-anime', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

// ─── Anime Follow ─────────────────────────────────────────────────────────────

export function getAnimeFollowStatus(slug: string) {
  return request<AnimeFollowStatus>(`/anime/${slug}/follow/me`);
}

export function followAnime(slug: string) {
  return request<AnimeFollowStatus & { message: string }>(`/anime/${slug}/follow`, {
    method: 'POST',
  });
}

export function unfollowAnime(slug: string) {
  return request<AnimeFollowStatus & { message: string }>(`/anime/${slug}/follow`, {
    method: 'DELETE',
  });
}

export function getUserFollowing(username: string, page = 1, limit = 24) {
  return request<PaginatedResponse<FollowedAnimeEntry>>(
    `/users/${username}/following?page=${page}&limit=${limit}`,
    { skipAuth: true },
  );
}

// ─── Hype XP ──────────────────────────────────────────────────────────────────

export function getUserHype(username: string) {
  return request<HypeStats>(`/users/${username}/hype`, { skipAuth: true });
}

// ─── Ranking ─────────────────────────────────────────────────────────────────

export function getAnimeRanking(limit = 50) {
  return request<AnimeRankingResponse>(`/anime/ranking?limit=${limit}`, { skipAuth: true });
}

export function getUserRanking(period: UserRankingPeriod = 'all', limit = 50) {
  return request<UserRankingResponse>(`/users/ranking?period=${period}&limit=${limit}`);
}

// ─── Admin — Anime ────────────────────────────────────────────────────────────

export function getAnimeAdmin(slug: string, token?: string) {
  return request<AnimeAdminData>(`/admin/anime/${slug}`, { token });
}

export function updateAnimeAdmin(slug: string, payload: UpdateAnimeAdminPayload, token?: string) {
  return request<AnimeAdminData>(`/admin/anime/${slug}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
    token,
  });
}

export function updateEpisodeAdmin(
  slug: string,
  number: number,
  payload: UpdateEpisodeAdminPayload,
  token?: string,
) {
  return request<AnimeAdminData>(`/admin/anime/${slug}/episodes/${number}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
    token,
  });
}

// ─── User Follow ──────────────────────────────────────────────────────────────

export function getUserSocialCounts(username: string) {
  return request<SocialCounts>(`/users/${username}/social-counts`, { skipAuth: true });
}

export function getUserFollowStatus(username: string) {
  return request<UserFollowStatus>(`/users/${username}/follow/me`);
}

export function followUser(username: string) {
  return request<UserFollowStatus & { message: string }>(`/users/${username}/follow`, {
    method: 'POST',
  });
}

export function unfollowUser(username: string) {
  return request<UserFollowStatus & { message: string }>(`/users/${username}/follow`, {
    method: 'DELETE',
  });
}

export function getUserFollowers(username: string, page = 1, limit = 24) {
  return request<PaginatedResponse<FollowedUserEntry>>(
    `/users/${username}/followers?page=${page}&limit=${limit}`,
    { skipAuth: true },
  );
}

export function getUserFollowingUsers(username: string, page = 1, limit = 24) {
  return request<PaginatedResponse<FollowedUserEntry>>(
    `/users/${username}/following-users?page=${page}&limit=${limit}`,
    { skipAuth: true },
  );
}

// ─── Feed ─────────────────────────────────────────────────────────────────────

export function getMyFeed(page = 1, limit = 20) {
  return request<PaginatedResponse<FeedItem>>(`/feed/me?page=${page}&limit=${limit}`);
}

export function getUserActivity(username: string, page = 1, limit = 15) {
  return request<PaginatedResponse<FeedItem>>(
    `/users/${username}/activity?page=${page}&limit=${limit}`,
    { skipAuth: true },
  );
}

// ─── Notifications ────────────────────────────────────────────────────────────

export function getMyNotifications(page = 1, limit = 20) {
  return request<NotificationsResponse>(`/notifications/me?page=${page}&limit=${limit}`);
}

export function getUnreadNotificationCount() {
  return request<{ unreadCount: number }>('/notifications/me/unread-count');
}

export function markNotificationRead(id: number) {
  return request<{ success: boolean }>(`/notifications/${id}/read`, { method: 'PATCH' });
}

export function markAllNotificationsRead() {
  return request<{ success: boolean }>('/notifications/me/read-all', { method: 'PATCH' });
}

// ─── Featured Review ──────────────────────────────────────────────────────────

export function getFeaturedReview() {
  return request<FeaturedReview | null>('/ratings/featured', { skipAuth: true });
}
