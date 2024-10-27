import { RedisService } from '@app/common';
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi';

export const CORS_REDIS_PROVIDER = 'CORS_REDIS_PROVIDER';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: './apps/auth/.env',
      isGlobal: true,
      validationSchema: Joi.object({
        CORS_REDIS_HOST: Joi.string().required(),
        CORS_REDIS_PORT: Joi.number().required(),
        CORS_REDIS_PASSWORD: Joi.string().required(),
        CORS_REDIS_DB: Joi.number().required(),
      }),
    }),
  ],
  providers: [
    {
      provide: CORS_REDIS_PROVIDER,
      useFactory: (configService: ConfigService) => {
        return new RedisService(CORS_REDIS_PROVIDER, {
          host: configService.getOrThrow('CORS_REDIS_HOST'),
          port: configService.getOrThrow('CORS_REDIS_PORT'),
          password: configService.getOrThrow('CORS_REDIS_PASSWORD'),
          db: configService.getOrThrow<number>('CORS_REDIS_DB'),
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [CORS_REDIS_PROVIDER],
})
export class CorsRedisModule {}
