import {
  GraphQLModule,
  HeaderResolver,
  HealthModule,
  I18nModule,
  LoggerModule,
  ThrottlerModule,
} from '@app/common';
import { AuthUsersServiceModule } from '@app/grpc/auth-users';
import { UsersPrismaModule } from '@app/prisma/users';
import { NotificationsUsersModule } from '@app/rmq/notifications-users';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import * as Joi from 'joi';
import { GrpcMetadataResolver } from 'nestjs-i18n';
import { AuthModule } from './auth/auth.module';
import { AuthGuard } from './guards/auth.guard';
import { ProfileModule } from './profile/profile.module';
import { VerificationRedisModule } from './redis/verification-redis.module';
import { OauthModule } from './oauth/oauth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: './apps/users/.env',
      isGlobal: true,
      validationSchema: Joi.object({
        HTTP_PORT_USERS: Joi.number().required(),
        USERS_DATABASE_URL: Joi.string().required(),
      }),
    }),
    LoggerModule,
    I18nModule.forRoot({
      resolvers: [new HeaderResolver(['x-lang']), GrpcMetadataResolver],
    }),
    ThrottlerModule.forRoot({
      name: 'users',
      envFilePath: './apps/users/.env',
    }),
    GraphQLModule.forRoot(),
    VerificationRedisModule,
    UsersPrismaModule,
    HealthModule,
    AuthUsersServiceModule.forRootAsync({
      envFilePath: './apps/users/.env',
    }),
    NotificationsUsersModule.forRootAsync({
      envFilePath: './apps/users/.env',
    }),
    AuthModule,
    ProfileModule,
    OauthModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class UsersModule {}
