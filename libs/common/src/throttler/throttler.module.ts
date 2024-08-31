import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import {
  ThrottlerModule as BaseThrottlerModule,
  ThrottlerGuard,
} from '@nestjs/throttler';
import { RedisOptions } from 'ioredis';
import * as Joi from 'joi';
import { RedisThrottlerStorage } from './redis-throttler.storage';

@Module({
  imports: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class ThrottlerModule {
  static forRoot({
    name,
    envFilePath,
  }: {
    name: string;
    envFilePath: string;
  }): DynamicModule {
    return {
      module: ThrottlerModule,
      imports: [
        ConfigModule.forRoot({
          envFilePath,
          isGlobal: true,
          validationSchema: Joi.object({
            THROTTLER_SHORT_TTL: Joi.number().required(),
            THROTTLER_SHORT_LIMIT: Joi.number().required(),

            THROTTLER_MEDIUM_TTL: Joi.number().required(),
            THROTTLER_MEDIUM_LIMIT: Joi.number().required(),

            THROTTLER_LONG_TTL: Joi.number().required(),
            THROTTLER_LONG_LIMIT: Joi.number().required(),
          }),
        }),
        BaseThrottlerModule.forRootAsync({
          useFactory(config: ConfigService) {
            const options: RedisOptions = {
              host: config.getOrThrow('THROTTLER_REDIS_HOST'),
              port: config.getOrThrow('THROTTLER_REDIS_PORT'),
              password: config.getOrThrow('THROTTLER_REDIS_PASSWORD'),
              db: config.getOrThrow<number>('THROTTLER_REDIS_DB'),
            };

            return {
              storage: new RedisThrottlerStorage(name, options),
              throttlers: [
                {
                  name: 'short',
                  ttl: Number(config.getOrThrow('THROTTLER_SHORT_TTL')),
                  limit: Number(config.getOrThrow('THROTTLER_SHORT_LIMIT')),
                },
                {
                  name: 'medium',
                  ttl: Number(config.getOrThrow('THROTTLER_MEDIUM_TTL')),
                  limit: Number(config.getOrThrow('THROTTLER_MEDIUM_LIMIT')),
                },
                {
                  name: 'long',
                  ttl: Number(config.getOrThrow('THROTTLER_LONG_TTL')),
                  limit: Number(config.getOrThrow('THROTTLER_LONG_LIMIT')),
                },
              ],
            };
          },
          inject: [ConfigService],
        }),
      ],
      exports: [],
    };
  }
}
