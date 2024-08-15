import {
  HeaderResolver,
  HealthModule,
  I18nModule,
  LoggerModule,
} from '@app/common';
import { AuthUsersServiceModule } from '@app/common/grpc/auth-users';
import { UsersNotificationsModule } from '@app/common/rmq/notifications/users';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { VerificationRedisModule } from './redis/verification-redis.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: './apps/users/.env',
      isGlobal: true,
      validationSchema: Joi.object({
        HTTP_PORT_USERS: Joi.number().required(),
        DATABASE_URL: Joi.string().required(),
      }),
    }),
    LoggerModule,
    I18nModule.forRoot({
      resolvers: [HeaderResolver],
    }),
    VerificationRedisModule,
    AuthUsersServiceModule.forRootAsync({ envFilePath: './apps/users/.env' }),
    UsersNotificationsModule.forRootAsync({
      envFilePath: './apps/users/.env',
    }),
    PrismaModule,
    HealthModule,
    AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class UsersModule {}
