import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { TokenService } from '../token/token.service';
import { ActivateUserController } from './controllers/activate-user.controller';
import { LoginController } from './controllers/login.controller';
import { ResendCodeController } from './controllers/resend-code.controller';
import { SignupController } from './controllers/signup.controller';
import { VerifyLoginController } from './controllers/verify-login.controller';
import { ActivateUserService } from './services/activate-user.service';
import { LoginService } from './services/login.service';
import { ResendCodeService } from './services/resend-code.service';
import { SignupService } from './services/signup.service';
import { VerifyLoginService } from './services/verify-login.service';
import { VerificationService } from './verification/verification.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: './apps/users/.env',
      isGlobal: true,
      validationSchema: Joi.object({
        ALLOW_CODE_ATTEMPTS: Joi.number().required(),
        ALLOW_RESEND_CODE_ATTEMPTS: Joi.number().required(),

        NORMAL_ACCESS_LIFETIME: Joi.number().required(),
        ACTIVATE_USER_ACCESS_LIFETIME: Joi.number().required(),
        VERIFY_LOGIN_ACCESS_LIFETIME: Joi.number().required(),

        NORMAL_REFRESH_LIFETIME: Joi.number().required(),
        ACTIVATE_USER_REFRESH_LIFETIME: Joi.number().required(),
        VERIFY_LOGIN_REFRESH_LIFETIME: Joi.number().required(),
      }),
    }),
  ],
  controllers: [
    SignupController,
    ActivateUserController,
    LoginController,
    VerifyLoginController,
    ResendCodeController,
  ],
  providers: [
    VerificationService,
    TokenService,
    SignupService,
    ActivateUserService,
    LoginService,
    VerifyLoginService,
    ResendCodeService,
  ],
})
export class AuthModule {}
