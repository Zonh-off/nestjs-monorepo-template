import { Injectable } from '@nestjs/common';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { PrismaService } from '@nestjs-monorepo-template/prisma';
import { authConfig, AuthUser } from './auth.instance';

@Injectable()
export class BetterAuthService {
  /**
   * Underlying Better Auth instance sharing the global NestJS Prisma connection pool
   */
  readonly instance: any;

  constructor(private readonly prisma: PrismaService) {
    this.instance = betterAuth({
      ...authConfig,
      database: prismaAdapter(this.prisma, {
        provider: 'postgresql',
      }),
    });
  }

  /**
   * Retrieve the current authenticated user context from HTTP Headers
   */
  async getCurrentUser(headers: Headers): Promise<AuthUser | null> {
    const session = await this.instance.api.getSession({ headers });
    return (session?.user as AuthUser) || null;
  }
}
