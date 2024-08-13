import { Injectable, Logger } from '@nestjs/common';
import Redis, {
  ChainableCommander,
  RedisKey,
  RedisOptions,
  RedisValue,
} from 'ioredis';

@Injectable()
export class RedisService extends Redis {
  private readonly logger = new Logger(RedisService.name);

  private transPipeline: ChainableCommander;

  constructor(
    private providerName: string,
    options?: RedisOptions,
  ) {
    super(options);

    this.on('ready', () => {
      this.logger.log('Connected to Redis, provider: ' + providerName);
    });

    this.on('error', (error) => {
      this.logger.error('Provider: ' + providerName + ', error: ' + error);
    });
  }

  async transaction<T>(
    callback: (pipeline: ChainableCommander) => Promise<T>,
  ): Promise<T> {
    this.transPipeline = this.pipeline();
    try {
      const result = await callback(this.transPipeline);

      await this.transPipeline.exec();

      return result;
    } catch (error) {
      this.transPipeline.discard();
      throw error;
    } finally {
      this.transPipeline = undefined;
    }
  }

  async setWithoutExpire(key: RedisKey | Buffer, value: RedisValue) {
    if (this.transPipeline) {
      this.transPipeline.set(key, value);
    } else {
      await this.set(key, value);
    }
  }

  async setWithExpire(
    key: RedisKey,
    value: RedisValue,
    seconds: number | string,
  ): Promise<void> {
    if (this.transPipeline) {
      this.transPipeline.set(key, value, 'EX', seconds);
    } else {
      await this.set(key, value, 'EX', seconds);
    }
  }

  async update(key: RedisKey, value: RedisValue): Promise<void> {
    const ttl = await this.ttl(key);
    this.logger.debug(`The key: ${key} has TTl: ${ttl}]`);

    if (ttl === -1) {
      await this.setWithoutExpire(key, value);
    } else if (ttl > 0) {
      await this.setWithExpire(key, value, ttl);
    } else {
      this.logger.debug(
        `The update process for [key: ${key}, TTl: ${ttl}] has been skipped.`,
      );
    }
  }

  async delete(key: RedisKey): Promise<void> {
    if (this.transPipeline) {
      this.transPipeline.del(key);
    } else {
      await this.del(key);
    }
  }
}
