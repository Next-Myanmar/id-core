import {
  GraphQLModule,
  HeaderResolver,
  HealthModule,
  I18nModule,
  LoggerModule,
  ThrottlerModule,
} from '@app/common';
import { AuthPrismaModule } from '@app/prisma/auth';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import * as Joi from 'joi';
import { GrpcMetadataResolver } from 'nestjs-i18n';
import { DevicesModule } from './devices/devices.module';
import { AuthGuard } from './guards/auth.guard';
import { OauthModule } from './oauth/oauth.module';
import { TokenRedisModule } from './redis/token-redis.module';
import { TokensService } from './services/tokens.service';
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
      resolvers: [new HeaderResolver(['x-lang']), GrpcMetadataResolver],
    }),
    ThrottlerModule.forRoot({
      name: 'auth',
      envFilePath: './apps/auth/.env',
    }),
    TokenRedisModule,
    HealthModule,
    AuthPrismaModule,
    GraphQLModule.forRoot(),
    UsersModule,
    OauthModule,
    DevicesModule,
  ],
  controllers: [],
  providers: [
    TokensService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AuthModule {}
