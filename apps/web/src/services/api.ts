import type {
  AnimeDetail,
  AnimeListItem,
  AnimeRatingResponse,
  AuthLoginResponse,
  AuthTokens,
  AuthUser,
  CalendarDay,
  Comment,
  EpisodeWithAnime,
  MyRating,
  PaginatedResponse,
} from '@/types/api';

const BASE = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001/api/v1';

async function request<T>(
  path: string,
  options: RequestInit & { token?: string } = {},
): Promise<T> {
  const { token, ...rest } = options;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(rest.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...rest, headers });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Erro desconhecido' }));
    throw new Error((err as { message?: string }).message ?? 'Request failed');
  }

  const json = (await res.json()) as { data?: T } | T;
  // A API envolve respostas em { data, statusCode }
  if (typeof json === 'object' && json !== null && 'data' in json) {
    return (json as { data: T }).data;
  }
  return json as T;
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
  return request<PaginatedResponse<AnimeListItem>>(`/anime${qs ? `?${qs}` : ''}`);
}

export function getAnimeBySlug(slug: string) {
  return request<AnimeDetail>(`/anime/${slug}`);
}

// ─── Episodes ───────────────────────────────────────────────────────────────

export function getTodayReleases() {
  return request<EpisodeWithAnime[]>('/episodes/today');
}

export function getWeeklyCalendar(days = 7) {
  return request<CalendarDay[]>(`/episodes/calendar?days=${days}`);
}

export function getRecentReleases(days = 7) {
  return request<CalendarDay[]>(`/episodes/recent?days=${days}`);
}

export function getAnimeEpisodes(animeId: number, page = 1, limit = 24) {
  return request<PaginatedResponse<EpisodeWithAnime>>(
    `/anime/${animeId}/episodes?page=${page}&limit=${limit}`,
  );
}

export function getEpisodeByNumber(animeId: number, number: number) {
  return request<EpisodeWithAnime>(`/anime/${animeId}/episodes/number/${number}`);
}

// ─── Comments ───────────────────────────────────────────────────────────────

export function getEpisodeComments(episodeId: number, page = 1, limit = 20, token?: string) {
  return request<PaginatedResponse<Comment>>(
    `/comments/episode/${episodeId}?page=${page}&limit=${limit}&rootOnly=true`,
    { token },
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
  });
}

export function register(username: string, email: string, password: string) {
  return request<AuthLoginResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, email, password }),
  });
}

export function getMe(token: string) {
  return request<AuthUser>('/auth/me', { token });
}

export function refreshTokens(userId: number, refreshToken: string) {
  return request<AuthTokens>('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ userId, refreshToken }),
  });
}

export function logout(token: string) {
  return request<void>('/auth/logout', { method: 'POST', token });
}

// ─── Users (perfil público) ──────────────────────────────────────────────────

export interface PublicProfile {
  id: number;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: string;
}

export function getPublicProfile(username: string) {
  return request<PublicProfile>(`/users/${username}`);
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
  return request<AnimeRatingResponse>(`/anime/${slug}/ratings?page=${page}`);
}

export function getMyAnimeRating(slug: string, token: string) {
  return request<MyRating | null>(`/anime/${slug}/ratings/me`, { token });
}

export function upsertAnimeRating(slug: string, payload: CreateRatingPayload, token: string) {
  return request<MyRating>(`/anime/${slug}/ratings`, {
    method: 'POST',
    body: JSON.stringify(payload),
    token,
  });
}

export function deleteAnimeRating(slug: string, token: string) {
  return request<{ message: string }>(`/anime/${slug}/ratings/me`, {
    method: 'DELETE',
    token,
  });
}
