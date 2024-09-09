import { RedisService } from '@app/common';
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi';

export const USERS_TOKEN_REDIS_PROVIDER = 'USERS_TOKEN_REDIS_PROVIDER';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: './apps/auth/.env',
      isGlobal: true,
      validationSchema: Joi.object({
        REDIS_HOST_USERS_TOKEN: Joi.string().required(),
        REDIS_PORT_USERS_TOKEN: Joi.number().required(),
        REDIS_PASSWORD_USERS_TOKEN: Joi.string().required(),
        REDIS_DB_USERS_TOKEN: Joi.number().required(),
      }),
    }),
  ],
  providers: [
    {
      provide: USERS_TOKEN_REDIS_PROVIDER,
      useFactory: (configService: ConfigService) => {
        return new RedisService(USERS_TOKEN_REDIS_PROVIDER, {
          host: configService.getOrThrow('REDIS_HOST_USERS_TOKEN'),
          port: configService.getOrThrow('REDIS_PORT_USERS_TOKEN'),
          password: configService.getOrThrow('REDIS_PASSWORD_USERS_TOKEN'),
          db: configService.getOrThrow<number>('REDIS_DB_USERS_TOKEN'),
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [USERS_TOKEN_REDIS_PROVIDER],
})
export class UsersTokenRedisModule {}
