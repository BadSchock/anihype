export const APP_NAME = 'AniHype';
export const APP_VERSION = '1.0.0';

export const API_ROUTES = {
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
  },
  ANIME: {
    LIST: '/anime',
    DETAIL: (id: number) => `/anime/${id}`,
    SEARCH: '/anime/search',
  },
  EPISODES: {
    LIST: '/episodes',
    DETAIL: (id: number) => `/episodes/${id}`,
    BY_ANIME: (animeId: number) => `/anime/${animeId}/episodes`,
    TODAY: '/episodes/today',
    WEEKLY: '/episodes/weekly',
  },
  COMMENTS: {
    LIST: (episodeId: number) => `/episodes/${episodeId}/comments`,
    CREATE: (episodeId: number) => `/episodes/${episodeId}/comments`,
    LIKE: (commentId: number) => `/comments/${commentId}/like`,
    DELETE: (commentId: number) => `/comments/${commentId}`,
  },
  USERS: {
    PROFILE: (username: string) => `/users/${username}`,
    ME: '/users/me',
  },
  ADMIN: {
    DASHBOARD: '/admin',
    ANIME: '/admin/anime',
    EPISODES: '/admin/episodes',
    USERS: '/admin/users',
    COMMENTS: '/admin/comments',
  },
} as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

export const ROLES = {
  USER: 'USER',
  PREMIUM: 'PREMIUM',
  MODERATOR: 'MODERATOR',
  ADMIN: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const HYPE_XP = {
  COMMENT: 10,
  REPLY: 5,
  LIKE_RECEIVED: 2,
  DAILY_LOGIN: 3,
} as const;
