import {
  HeaderResolver,
  HealthModule,
  I18nModule,
  LoggerModule,
} from '@app/common';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { GrpcMetadataResolver } from 'nestjs-i18n';
import { TokenRedisModule } from './redis/token-redis.module';
import { TokenService } from './token/token.service';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: './apps/auth/.env',
      isGlobal: true,
      validationSchema: Joi.object({
        HTTP_PORT_AUTH: Joi.number().required(),
      }),
    }),
    LoggerModule,
    I18nModule.forRoot({
      resolvers: [HeaderResolver, GrpcMetadataResolver],
    }),
    TokenRedisModule,
    HealthModule,
    UsersModule,
  ],
  controllers: [],
  providers: [TokenService],
})
export class AuthModule {}
