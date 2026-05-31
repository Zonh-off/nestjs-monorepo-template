import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthUser } from '@nestjs-monorepo-template/auth';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AuthUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
