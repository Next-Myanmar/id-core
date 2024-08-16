import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { SendActivateUserEmailController } from './controllers/send-activate-user-email.controller';
import { SendWelcomeUserEmailController } from './controllers/send-welcome-user-email.controller';
import { ActivateUserEmailModule } from './email-modules/activate-user-email.module';
import { WelcomeUserEmailModule } from './email-modules/welcome-user-email.module';
import { SendActivateUserEmailService } from './services/send-activate-user-email.service';
import { SendWelcomeUserEmailService } from './services/send-welcome-user-email.service';
import { TestUsersModule } from './test-users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: './apps/notifications/.env',
      isGlobal: true,
      validationSchema: Joi.object({
        RMQ_USER_USERS: Joi.string().required(),
        RMQ_PASSWORD_USERS: Joi.string().required(),
        RMQ_HOST_USERS: Joi.string().required(),
        RMQ_PORT_USERS: Joi.number().required(),
        RMQ_QUEUE_USERS: Joi.string().required(),
      }),
    }),
    ActivateUserEmailModule,
    WelcomeUserEmailModule,
    ...(process.env.NODE_ENV === 'development' ? [TestUsersModule] : []),
  ],
  controllers: [
    SendActivateUserEmailController,
    SendWelcomeUserEmailController,
  ],
  providers: [SendActivateUserEmailService, SendWelcomeUserEmailService],
})
export class UsersModule {}
