import { EmailModule } from '@app/common';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi';

export const SEND_VERIFY_LOGIN_EMAIL_PROVIDER =
  'SEND_VERIFY_LOGIN_EMAIL_PROVIDER';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: './apps/notifications/.env',
      isGlobal: true,
      validationSchema: Joi.object({
        SMTP_HOST_USERS_VERIFY_LOGIN: Joi.string().required(),
        SMTP_PORT_USERS_VERIFY_LOGIN: Joi.number().required(),
        SMTP_USER_USERS_VERIFY_LOGIN: Joi.string().email().required(),
        SMTP_SECURE_USERS_VERIFY_LOGIN: Joi.boolean().required(),
        SMTP_AUTH_TYPE_USERS_VERIFY_LOGIN: Joi.string().required(),
        SMTP_AUTH_TYPE_CLIENT_ID_USERS_VERIFY_LOGIN: Joi.string().required(),
        SMTP_AUTH_TYPE_CLIENT_SECRET_USERS_VERIFY_LOGIN:
          Joi.string().required(),
        SMTP_AUTH_TYPE_REFRESH_TOKEN_USERS_VERIFY_LOGIN:
          Joi.string().required(),
      }),
    }),
    EmailModule.forRootAsync({
      name: SEND_VERIFY_LOGIN_EMAIL_PROVIDER,
      mailerOptions: {
        useFactory: async (configService: ConfigService) => ({
          transport: {
            host: configService.getOrThrow('SMTP_HOST_USERS_VERIFY_LOGIN'),
            port: configService.getOrThrow<number>(
              'SMTP_PORT_USERS_VERIFY_LOGIN',
            ),
            secure: configService
              .getOrThrow('SMTP_SECURE_USERS_VERIFY_LOGIN')
              .toBoolean(),
            auth: configService
              .getOrThrow('SMTP_SECURE_USERS_VERIFY_LOGIN')
              .toBoolean()
              ? {
                  type: configService.getOrThrow(
                    'SMTP_AUTH_TYPE_USERS_VERIFY_LOGIN',
                  ),
                  user: configService.getOrThrow(
                    'SMTP_USER_USERS_VERIFY_LOGIN',
                  ),
                  clientId: configService.getOrThrow(
                    'SMTP_AUTH_TYPE_CLIENT_ID_USERS_VERIFY_LOGIN',
                  ),
                  clientSecret: configService.getOrThrow(
                    'SMTP_AUTH_TYPE_CLIENT_SECRET_USERS_VERIFY_LOGIN',
                  ),
                  refreshToken: configService.getOrThrow(
                    'SMTP_AUTH_TYPE_REFRESH_TOKEN_USERS_VERIFY_LOGIN',
                  ),
                }
              : undefined,
          },
          defaults: {
            from: configService.getOrThrow('SMTP_USER_USERS_VERIFY_LOGIN'),
          },
        }),
        inject: [ConfigService],
      },
    }),
  ],
})
export class VerifyLoginEmailModule {}
