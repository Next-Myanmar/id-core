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
import * as Joi from 'joi';
import { OauthModule } from './oauth/oauth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: './apps/admin/.env',
      isGlobal: true,
      validationSchema: Joi.object({
        HTTP_PORT_ADMIN: Joi.number().required(),
        AUTH_DATABASE_URL: Joi.string().required(),
      }),
    }),
    LoggerModule,
    I18nModule.forRoot({
      resolvers: [new HeaderResolver(['x-lang'])],
    }),
    ThrottlerModule.forRoot({
      name: 'admin',
      envFilePath: './apps/admin/.env',
    }),
    HealthModule,
    AuthPrismaModule,
    GraphQLModule.forRoot(),
    OauthModule,
  ],
  controllers: [],
  providers: [],
})
export class AdminModule {}
