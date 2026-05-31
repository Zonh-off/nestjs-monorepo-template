import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { BetterAuthService } from '@nestjs-monorepo-template/auth';

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private authService: BetterAuthService,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    // Headers constructor is available in Node 18+ globally, but for passing to better-auth
    // we need to construct a standard Headers object.
    const headers = new Headers();
    Object.keys(request.headers).forEach(key => {
      headers.set(key, request.headers[key] as string);
    });

    try {
      const user = await this.authService.getCurrentUser(headers);
      if (!user) {
        throw new UnauthorizedException('Invalid or missing authentication token');
      }
      // Attach user to request object
      request.user = user;
      return true;
    } catch (e) {
      throw new UnauthorizedException('Authentication failed');
    }
  }
}
