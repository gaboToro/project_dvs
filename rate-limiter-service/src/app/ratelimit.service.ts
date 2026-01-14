import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: number;
};

@Injectable()
export class RateLimitService implements OnModuleDestroy {
  private readonly redis: Redis;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  }

  async onModuleDestroy(): Promise<void> {
    if (typeof this.redis.quit === 'function') {
      await this.redis.quit();
      return;
    }

    if (typeof this.redis.disconnect === 'function') {
      this.redis.disconnect();
    }
  }

  async check(key: string, limit: number, windowSec: number): Promise<RateLimitResult> {
    const now = Date.now();
    const redisKey = `ratelimit:${key}`;

    const pipeline = this.redis.multi();
    pipeline.incr(redisKey);
    pipeline.ttl(redisKey);
    const results = await pipeline.exec();

    const count = Number(results?.[0]?.[1] ?? 0);
    let ttl = Number(results?.[1]?.[1] ?? -1);

    if (ttl < 0) {
      await this.redis.expire(redisKey, windowSec);
      ttl = windowSec;
    }

    const remaining = Math.max(limit - count, 0);
    const resetAt = now + ttl * 1000;

    return {
      allowed: count <= limit,
      remaining,
      limit,
      resetAt,
    };
  }
}
