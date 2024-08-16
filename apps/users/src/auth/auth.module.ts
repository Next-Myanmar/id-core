import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { TokenService } from '../token/token.service';
import { ActivateUserController } from './controllers/activate-user.controller';
import { SignupController } from './controllers/signup.controller';
import { ActivateUserService } from './services/activate-user.service';
import { SignupService } from './services/signup.service';
import { VerificationService } from './verification/verification.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: './apps/users/.env',
      isGlobal: true,
      validationSchema: Joi.object({
        ALLOW_CODE_ATTEMPTS: Joi.number().required(),
        CODE_LIFETIME: Joi.number().required(),

        NORMAL_ACCESS_LIFETIME: Joi.number().required(),
        ACTIVATE_USER_ACCESS_LIFETIME: Joi.number().required(),

        NORMAL_REFRESH_LIFETIME: Joi.number().required(),
        ACTIVATE_USER_REFRESH_LIFETIME: Joi.number().required(),
      }),
    }),
  ],
  controllers: [SignupController, ActivateUserController],
  providers: [
    VerificationService,
    TokenService,
    SignupService,
    ActivateUserService,
  ],
})
export class AuthModule {}
