import { RedisService } from '@app/common';
import { AuthPrismaService } from '@app/prisma/auth';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CORS_REDIS_PROVIDER } from '../redis/cors-redis.module';
import { CorsInfo } from '../types/cors-info.interface';

@Injectable()
export class CorsService {
  private readonly logger = new Logger(CorsService.name);

  constructor(
    private config: ConfigService,
    @Inject(CORS_REDIS_PROVIDER)
    private readonly corsRedis: RedisService,
    private readonly prisma: AuthPrismaService,
  ) {}

  private getKey(origin: string): string {
    return `cors-origin-${origin}`;
  }

  async isAllow(origin: string): Promise<boolean> {
    const key = this.getKey(origin);
    this.logger.debug(`Cors Key: ${key}`);

    const value = await this.corsRedis.get(key);
    this.logger.debug(`Cors Value: ${value}`);

    if (value) {
      const data: CorsInfo = JSON.parse(value);

      return data.allow;
    }

    const client = await this.prisma.clientOauth.findFirst({
      where: {
        homeUri: origin,
      },
    });

    const allow = client !== null;

    const ttl = Number(this.config.getOrThrow('CORS_TTL'));

    const corsInfo: CorsInfo = {
      allow,
    };

    await this.corsRedis.setWithExpire(key, JSON.stringify(corsInfo), ttl);

    return allow;
  }
}
