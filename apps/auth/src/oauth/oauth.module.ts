import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: './apps/auth/.env',
      isGlobal: true,
      validationSchema: Joi.object({
        OAUTH_ACCESS_TOKEN_LIFETIME: Joi.number().required(),
        OAUTH_REFRESH_TOKEN_LIFETIME: Joi.number().required(),
      }),
    }),
  ],
})
export class OauthModule {}
