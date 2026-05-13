import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

export type UserRole = 'USER' | 'PREMIUM' | 'MODERATOR' | 'ADMIN' | 'SUPER_ADMIN';

export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

export const Public = () => SetMetadata('isPublic', true);
