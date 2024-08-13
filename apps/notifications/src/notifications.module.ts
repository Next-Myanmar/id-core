import { HeaderResolver, I18nModule, LoggerModule } from '@app/common';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: './apps/notifications/.env',
      isGlobal: true,
      validationSchema: Joi.object({
        HTTP_PORT_NOTIFICATIONS: Joi.number().required(),
      }),
    }),
    LoggerModule,
    I18nModule.forRoot({
      resolvers: [HeaderResolver],
    }),
    UsersModule,
  ],
  controllers: [],
  providers: [],
})
export class NotificationsModule {}
