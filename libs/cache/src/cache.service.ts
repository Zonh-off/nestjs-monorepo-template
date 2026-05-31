import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  /**
   * Retrieve a value from the cache by its key.
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.cacheManager.get<T>(key);
      return value ?? null;
    } catch (error) {
      this.logger.error(`Failed to get cache key "${key}":`, error);
      return null;
    }
  }

  /**
   * Set a value in the cache with an optional TTL (in milliseconds).
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      await this.cacheManager.set(key, value, ttl);
    } catch (error) {
      this.logger.error(`Failed to set cache key "${key}":`, error);
    }
  }

  /**
   * Delete a key from the cache.
   */
  async del(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
    } catch (error) {
      this.logger.error(`Failed to delete cache key "${key}":`, error);
    }
  }

  /**
   * Clear all cache data.
   */
  async reset(): Promise<void> {
    try {
      await this.cacheManager.clear();
    } catch (error) {
      this.logger.error('Failed to clear cache:', error);
    }
  }

  /**
   * Tries to retrieve a key from cache. If not found, runs the fallback
   * callback, caches the result with the given TTL, and returns it.
   */
  async wrap<T>(key: string, fallback: () => Promise<T>, ttl?: number): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      this.logger.log(`Cache hit for key: "${key}"`);
      return cached;
    }

    this.logger.log(`Cache miss for key: "${key}". Fetching fresh data...`);
    const freshData = await fallback();
    await this.set(key, freshData, ttl);
    return freshData;
  }
}
