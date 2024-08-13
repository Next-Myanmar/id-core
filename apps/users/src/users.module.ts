import { LoggerModule, PrismaModule } from '@app/common';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';

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
    PrismaModule,
  ],
  controllers: [],
  providers: [],
})
export class UsersModule {}
