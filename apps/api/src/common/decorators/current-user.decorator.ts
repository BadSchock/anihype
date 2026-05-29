import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export interface CurrentUserPayload {
  sub: number;
  email: string;
  username: string;
  roles: string[];
}

export const CurrentUser = createParamDecorator(
  (
    data: keyof CurrentUserPayload | 'id' | undefined,
    ctx: ExecutionContext,
  ): CurrentUserPayload | number | string | string[] | undefined => {
    const request = ctx.switchToHttp().getRequest<
      Request & { user?: CurrentUserPayload | null }
    >();
    const user = request.user;
    if (!user) return undefined;
    if (data === 'id' || data === 'sub') return user.sub;
    if (data) return user[data];
    return user;
  },
);
