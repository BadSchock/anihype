import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export interface CurrentUserPayload {
  sub: number;
  email: string;
  username: string;
  roles: string[];
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentUserPayload => {
    const request = ctx.switchToHttp().getRequest<Request & { user: CurrentUserPayload }>();
    return request.user;
  },
);
