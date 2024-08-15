import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { SignupController } from './controllers/signup.controller';
import { SignupService } from './services/signup.service';
import { TokenService } from './services/token.service';
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
  controllers: [SignupController],
  providers: [VerificationService, TokenService, SignupService],
})
export class AuthModule {}
