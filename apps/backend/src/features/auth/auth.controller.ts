import { Controller, All, Req, Res, Get } from '@nestjs/common';
import { Request, Response } from 'express';
import { BetterAuthService, AuthUser } from '@nestjs-monorepo-template/auth';
import { toNodeHandler } from 'better-auth/node';
import { Public } from '../../core/decorators/public.decorator';
import { CurrentUser } from '../../core/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: BetterAuthService) { }

  @Get('me')
  getMe(@CurrentUser() user: AuthUser) {
    return user;
  }

  @Public()
  @All('*path')
  betterAuthHandler(@Req() req: Request, @Res() res: Response) {
    const handler = toNodeHandler(this.authService.instance);
    return handler(req, res);
  }
}
