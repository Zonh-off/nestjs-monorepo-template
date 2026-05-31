import { Global, Module } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { env } from '@nestjs-monorepo-template/common';
import { CacheService } from './cache.service';

@Global()
@Module({
  imports: [
    NestCacheModule.registerAsync({
      useFactory: async () => ({
        store: await redisStore({
          socket: {
            host: env.REDIS_HOST,
            port: env.REDIS_PORT,
          },
          password: env.REDIS_PASSWORD || undefined,
          ttl: 60 * 1000, // 60 seconds default TTL
        }),
      }),
    }),
  ],
  providers: [CacheService],
  exports: [NestCacheModule, CacheService],
})
export class CacheModule {}
