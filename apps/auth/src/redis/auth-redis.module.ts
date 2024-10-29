import { RedisService } from '@app/common';
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi';

export const AUTH_REDIS_PROVIDER = 'AUTH_REDIS_PROVIDER';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: './apps/auth/.env',
      isGlobal: true,
      validationSchema: Joi.object({
        AUTH_REDIS_HOST: Joi.string().required(),
        AUTH_REDIS_PORT: Joi.number().required(),
        AUTH_REDIS_PASSWORD: Joi.string().required(),
        AUTH_REDIS_DB: Joi.number().required(),
      }),
    }),
  ],
  providers: [
    {
      provide: AUTH_REDIS_PROVIDER,
      useFactory: (configService: ConfigService) => {
        return new RedisService(AUTH_REDIS_PROVIDER, {
          host: configService.getOrThrow('AUTH_REDIS_HOST'),
          port: configService.getOrThrow('AUTH_REDIS_PORT'),
          password: configService.getOrThrow('AUTH_REDIS_PASSWORD'),
          db: configService.getOrThrow<number>('AUTH_REDIS_DB'),
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [AUTH_REDIS_PROVIDER],
})
export class AuthRedisModule {}
