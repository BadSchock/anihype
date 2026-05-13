export type UserRole = 'USER' | 'PREMIUM' | 'MODERATOR' | 'ADMIN' | 'SUPER_ADMIN';

export interface User {
  id: number;
  username: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  roles: UserRole[];
  createdAt: string;
}

export interface UserProfile extends User {
  commentCount: number;
  hypeLevel: number | null;
  hypeXp: number;
  badges: Badge[];
  mainBadge: Badge | null;
}

export interface Badge {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  iconUrl: string | null;
  color: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}
