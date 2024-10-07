import { RedisService } from '@app/common';
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi';

export const TOKEN_REDIS_PROVIDER = 'TOKEN_REDIS_PROVIDER';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: './apps/auth/.env',
      isGlobal: true,
      validationSchema: Joi.object({
        TOKEN_REDIS_HOST: Joi.string().required(),
        TOKEN_REDIS_PORT: Joi.number().required(),
        TOKEN_REDIS_PASSWORD: Joi.string().required(),
        TOKEN_REDIS_DB: Joi.number().required(),
      }),
    }),
  ],
  providers: [
    {
      provide: TOKEN_REDIS_PROVIDER,
      useFactory: (configService: ConfigService) => {
        return new RedisService(TOKEN_REDIS_PROVIDER, {
          host: configService.getOrThrow('TOKEN_REDIS_HOST'),
          port: configService.getOrThrow('TOKEN_REDIS_PORT'),
          password: configService.getOrThrow('TOKEN_REDIS_PASSWORD'),
          db: configService.getOrThrow<number>('TOKEN_REDIS_DB'),
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [TOKEN_REDIS_PROVIDER],
})
export class TokenRedisModule {}
