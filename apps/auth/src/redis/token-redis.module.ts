import { RedisService } from '@app/common';
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi';

export const TOKEN_REDIS_PROVIDER = 'TokenRedis';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: './apps/auth/.env',
      isGlobal: true,
      validationSchema: Joi.object({
        REDIS_HOST_TOKEN: Joi.string().required(),
        REDIS_PORT_TOKEN: Joi.number().required(),
        REDIS_PASSWORD_TOKEN: Joi.string().required(),
        REDIS_DB_TOKEN: Joi.number().required(),
      }),
    }),
  ],
  providers: [
    {
      provide: TOKEN_REDIS_PROVIDER,
      useFactory: (configService: ConfigService) => {
        return new RedisService(TOKEN_REDIS_PROVIDER, {
          host: configService.getOrThrow('REDIS_HOST_TOKEN'),
          port: configService.getOrThrow('REDIS_PORT_TOKEN'),
          password: configService.getOrThrow('REDIS_PASSWORD_TOKEN'),
          db: configService.getOrThrow<number>('REDIS_DB_TOKEN'),
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [TOKEN_REDIS_PROVIDER],
})
export class TokenRedisModule {}
