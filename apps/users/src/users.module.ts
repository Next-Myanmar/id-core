import {
  HeaderResolver,
  HealthModule,
  I18nModule,
  LoggerModule,
  ThrottlerModule,
} from '@app/common';
import { UsersNotificationsModule } from '@app/common/rmq/notifications/users';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import * as Joi from 'joi';
import { AuthModule } from './auth/auth.module';
import { AuthGuard } from './guards/auth.guard';
import { PrismaModule } from './prisma/prisma.module';
import { VerificationRedisModule } from './redis/verification-redis.module';
import { TokenModule } from './token/token.module';

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
      resolvers: [new HeaderResolver(['x-lang'])],
    }),
    ThrottlerModule.forRoot({
      name: 'users',
      envFilePath: './apps/users/.env',
    }),
    VerificationRedisModule,
    UsersNotificationsModule.forRootAsync({
      envFilePath: './apps/users/.env',
    }),
    PrismaModule,
    TokenModule,
    HealthModule,
    AuthModule,
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
