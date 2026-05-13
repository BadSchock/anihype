export type CommentStatus = 'ACTIVE' | 'REMOVED_BY_USER' | 'REMOVED_BY_MOD' | 'REMOVED_BY_ADMIN';

export interface Comment {
  id: number;
  episodeId: number;
  userId: number;
  parentId: number | null;
  content: string;
  isSpoiler: boolean;
  status: CommentStatus;
  likesCount: number;
  repliesCount: number;
  isLikedByCurrentUser: boolean;
  user: {
    id: number;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    mainBadge: {
      name: string;
      iconUrl: string | null;
      color: string | null;
    } | null;
  };
  replies?: Comment[];
  createdAt: string;
  updatedAt: string;
}

export interface CommentListResponse {
  data: Comment[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateCommentDto {
  content: string;
  isSpoiler?: boolean;
  parentId?: number;
}
