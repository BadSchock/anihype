export * from './user.types';
export * from './anime.types';
export * from './episode.types';
export * from './comment.types';

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}
