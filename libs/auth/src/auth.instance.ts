import { env } from '@nestjs-monorepo-template/common';
import { type User, type BetterAuthOptions } from 'better-auth';
import { admin } from 'better-auth/plugins';

export const authConfig: BetterAuthOptions = {
  baseURL: `${env.API_URL}/auth`,
  trustedOrigins: [
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:4000',
  ],
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
    discord: {
      clientId: env.DISCORD_CLIENT_ID,
      clientSecret: env.DISCORD_CLIENT_SECRET,
    },
  },
  plugins: [
    admin(),
  ],
};

/**
 * Portable, fully-typed representation of our authenticated User session,
 * explicitly extending standard fields with custom Admin properties.
 */
export interface AuthUser extends User {
  role?: string | null;
  banned?: boolean | null;
}
