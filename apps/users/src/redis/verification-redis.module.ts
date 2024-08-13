import { RedisService } from '@app/common';
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisOptions } from 'ioredis';
import * as Joi from 'joi';

export const VERIFICATION_REDIS_PROVIDER = 'verification-redis';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: './apps/users/.env',
      isGlobal: true,
      validationSchema: Joi.object({
        REDIS_HOST_VERIFICATION: Joi.string().required(),
        REDIS_PORT_VERIFICATION: Joi.number().required(),
        REDIS_PASSWORD_VERIFICATION: Joi.string().required(),
        REDIS_DB_VERIFICATION: Joi.number().required(),
      }),
    }),
  ],
  controllers: [],
  providers: [
    {
      provide: VERIFICATION_REDIS_PROVIDER,
      useFactory: (configService: ConfigService) => {
        const options: RedisOptions = {
          host: configService.getOrThrow('REDIS_HOST_VERIFICATION'),
          port: configService.getOrThrow('REDIS_PORT_VERIFICATION'),
          password: configService.getOrThrow('REDIS_PASSWORD_VERIFICATION'),
          db: configService.getOrThrow<number>('REDIS_DB_VERIFICATION'),
        };
        return new RedisService(VERIFICATION_REDIS_PROVIDER, options);
      },
      inject: [ConfigService],
    },
  ],
  exports: [VERIFICATION_REDIS_PROVIDER],
})
export class VerificationRedisModule {}
