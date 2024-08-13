import {
  HeaderResolver,
  I18nModule,
  LoggerModule,
  PrismaModule,
} from '@app/common';
import { AuthUsersServiceModule } from '@app/common/grpc/auth-users';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { AuthModule } from './auth/auth.module';
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
    PrismaModule,
    VerificationRedisModule,
    AuthUsersServiceModule.forRootAsync({ envFilePath: './apps/users/.env' }),
    AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class UsersModule {}
