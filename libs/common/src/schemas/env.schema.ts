import { z } from 'zod';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Load environment variables dynamically based on current working directory
dotenv.config();
dotenv.config({ path: join(process.cwd(), '.env') });

// Helper to expand variable placeholders (e.g. ${VAR}) in string values
const expandEnvVars = (val?: string): string => {
  if (!val) return '';
  return val.replace(/\${(\w+)}/g, (_, name) => process.env[name] || '');
};

const defaultDatabaseUrl = `postgresql://${process.env.POSTGRES_USER || 'postgres'}:${process.env.POSTGRES_PASSWORD || 'postgres'}@localhost:${process.env.POSTGRES_PORT || 5433}/${process.env.POSTGRES_DB || 'nestjs-monorepo-template'}?schema=public`;

export const EnvSchema = z.object({
  POSTGRES_USER: z.string().default('postgres'),
  POSTGRES_PASSWORD: z.string().default('postgres'),
  POSTGRES_DB: z.string().default('nestjs-monorepo-template'),
  POSTGRES_PORT: z.coerce.number().default(5433),
  DATABASE_URL: z.string().url().default(defaultDatabaseUrl),
  GOOGLE_CLIENT_ID: z.string().optional().default(''),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(''),
  DISCORD_CLIENT_ID: z.string().optional().default(''),
  DISCORD_CLIENT_SECRET: z.string().optional().default(''),
  WEB_URL: z.string().url().default('http://localhost:4000'),
  API_URL: z.string().url().default('http://localhost:4001'),
  ADMIN_URL: z.string().url().default('http://localhost:3001'),
  PORT: z.coerce.number().default(4001),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional().default(''),
  STORAGE_PROVIDER: z.enum(['local', 's3']).default('local'),
  STORAGE_S3_BUCKET: z.string().optional().default(''),
  STORAGE_S3_REGION: z.string().optional().default('us-east-1'),
  STORAGE_S3_ACCESS_KEY_ID: z.string().optional().default(''),
  STORAGE_S3_SECRET_ACCESS_KEY: z.string().optional().default(''),
  STORAGE_S3_ENDPOINT: z.string().optional().default(''),
});

export type EnvConfig = z.infer<typeof EnvSchema>;

const parsedRawEnv = {
  ...process.env,
  DATABASE_URL: process.env.DATABASE_URL ? expandEnvVars(process.env.DATABASE_URL) : undefined,
};

export const env = EnvSchema.parse(parsedRawEnv);
