import type {
  AnimeDetail,
  AnimeListItem,
  AuthTokens,
  AuthUser,
  CalendarDay,
  Comment,
  EpisodeWithAnime,
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

export function getAnimeEpisodes(animeId: number, page = 1, limit = 24) {
  return request<PaginatedResponse<EpisodeWithAnime>>(
    `/anime/${animeId}/episodes?page=${page}&limit=${limit}`,
  );
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

export function login(email: string, password: string) {
  return request<AuthTokens>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function register(username: string, email: string, password: string) {
  return request<AuthTokens>('/auth/register', {
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
