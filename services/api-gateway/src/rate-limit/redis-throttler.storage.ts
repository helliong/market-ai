import type { ThrottlerStorage } from '@nestjs/throttler';
import type { ThrottlerStorageRecord } from '@nestjs/throttler/dist/throttler-storage-record.interface';
import Redis from 'ioredis';

export class RedisThrottlerStorage implements ThrottlerStorage {
  private readonly redis: Redis;

  constructor(redisUrl: string) {
    this.redis = new Redis(redisUrl, {
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
    });
  }

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    const now = Date.now();
    const hitKey = `throttle:${throttlerName}:${key}:hits`;
    const blockKey = `throttle:${throttlerName}:${key}:blocked`;
    const blockTtl = await this.redis.pttl(blockKey);

    if (blockTtl > 0) {
      return {
        totalHits: Number((await this.redis.zcard(hitKey)) ?? 0),
        timeToExpire: await this.getTtlSeconds(hitKey),
        isBlocked: true,
        timeToBlockExpire: Math.ceil(blockTtl / 1000),
      };
    }

    const member = `${now}:${Math.random().toString(36).slice(2)}`;
    const pipeline = this.redis.pipeline();

    pipeline.zremrangebyscore(hitKey, 0, now - ttl);
    pipeline.zadd(hitKey, now, member);
    pipeline.pexpire(hitKey, ttl);
    pipeline.zcard(hitKey);

    const results = await pipeline.exec();
    const totalHits = Number(results?.[3]?.[1] ?? 0);

    if (totalHits > limit) {
      await this.redis.psetex(blockKey, blockDuration || ttl, '1');
    }

    return {
      totalHits,
      timeToExpire: await this.getTtlSeconds(hitKey),
      isBlocked: totalHits > limit,
      timeToBlockExpire:
        totalHits > limit ? await this.getTtlSeconds(blockKey) : 0,
    };
  }

  private async getTtlSeconds(key: string) {
    const ttl = await this.redis.pttl(key);
    return ttl > 0 ? Math.ceil(ttl / 1000) : 0;
  }
}
