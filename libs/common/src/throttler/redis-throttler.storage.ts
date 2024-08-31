import { Logger } from '@nestjs/common';
import { ThrottlerStorage } from '@nestjs/throttler';
import { ThrottlerStorageRecord } from '@nestjs/throttler/dist/throttler-storage-record.interface';
import Redis, { RedisOptions } from 'ioredis';

export class RedisThrottlerStorage implements ThrottlerStorage {
  private readonly logger = new Logger(RedisThrottlerStorage.name);

  private readonly redis: Redis;

  constructor(
    public readonly name: string,
    options?: RedisOptions,
  ) {
    this.redis = new Redis(options);

    this.redis.on('ready', () => {
      this.logger.log('Connected to Throttler Redis');
    });

    this.redis.on('error', (error) => {
      this.logger.error('Throttler Redis error: ' + error);
    });
  }

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    const blockedKey = `${this.name}:${throttlerName}:${key}:blocked`;
    this.logger.debug(`Blocked key: ${blockedKey}`);

    const requestKey = `${this.name}:${throttlerName}:${key}`;
    this.logger.debug(`Request key: ${requestKey}`);

    const isBlocked = await this.redis.get(blockedKey);
    this.logger.debug(`Is blocked: ${isBlocked}`);

    const blockExpiry = await this.redis.ttl(blockedKey);
    this.logger.debug(`Block expiry: ${blockExpiry}`);

    if (isBlocked) {
      const data = {
        totalHits: 0,
        timeToExpire: ttl,
        isBlocked: true,
        timeToBlockExpire: blockExpiry > 0 ? blockExpiry : blockDuration,
      };

      this.logger.debug(`Throttler data (isBlocked): ${JSON.stringify(data)}`);
      return data;
    }

    const pipeline = this.redis.pipeline();
    pipeline.incr(requestKey);
    pipeline.ttl(requestKey);
    pipeline.expire(requestKey, Math.ceil(ttl / 1000));

    const [incrResult, ttlResult] = await pipeline.exec();

    const totalHits = Number(incrResult[1]);
    this.logger.debug(`Total Hits: ${totalHits}`);

    this.logger.debug(`Limit: ${limit}`);

    const currentTtl = Number(ttlResult[1]);
    this.logger.debug(`Current Ttl: ${currentTtl}`);

    if (totalHits > limit) {
      await this.redis.set(
        blockedKey,
        '1',
        'EX',
        Math.ceil(blockDuration / 1000),
      );

      const data = {
        totalHits,
        timeToExpire: currentTtl > 0 ? currentTtl : ttl,
        isBlocked: true,
        timeToBlockExpire: blockDuration,
      };

      this.logger.debug(
        `Throttler data (totalHits > limit): ${JSON.stringify(data)}`,
      );

      return data;
    }

    const data = {
      totalHits,
      timeToExpire: currentTtl > 0 ? currentTtl : ttl,
      isBlocked: false,
      timeToBlockExpire: 0,
    };

    this.logger.debug(`Throttler data: ${JSON.stringify(data)}`);

    return data;
  }
}
