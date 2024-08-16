import { EmailModule } from '@app/common';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi';

export const SEND_WELCOME_USER_EMAIL_PROVIDER =
  'SEND_WELCOME_USER_EMAIL_PROVIDER';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: './apps/notifications/.env',
      isGlobal: true,
      validationSchema: Joi.object({
        SMTP_HOST_USERS_WELCOME_USER: Joi.string().required(),
        SMTP_PORT_USERS_WELCOME_USER: Joi.number().required(),
        SMTP_USER_USERS_WELCOME_USER: Joi.string().email().required(),
        SMTP_SECURE_USERS_WELCOME_USER: Joi.boolean().required(),
        SMTP_AUTH_TYPE_USERS_WELCOME_USER: Joi.string().required(),
        SMTP_AUTH_TYPE_CLIENT_ID_USERS_WELCOME_USER: Joi.string().required(),
        SMTP_AUTH_TYPE_CLIENT_SECRET_USERS_WELCOME_USER:
          Joi.string().required(),
        SMTP_AUTH_TYPE_REFRESH_TOKEN_USERS_WELCOME_USER:
          Joi.string().required(),
      }),
    }),
    EmailModule.forRootAsync({
      name: SEND_WELCOME_USER_EMAIL_PROVIDER,
      mailerOptions: {
        useFactory: async (configService: ConfigService) => ({
          transport: {
            host: configService.getOrThrow('SMTP_HOST_USERS_WELCOME_USER'),
            port: configService.getOrThrow<number>(
              'SMTP_PORT_USERS_WELCOME_USER',
            ),
            secure: configService
              .getOrThrow('SMTP_SECURE_USERS_WELCOME_USER')
              .toBoolean(),
            auth: configService
              .getOrThrow('SMTP_SECURE_USERS_WELCOME_USER')
              .toBoolean()
              ? {
                  type: configService.getOrThrow(
                    'SMTP_AUTH_TYPE_USERS_WELCOME_USER',
                  ),
                  user: configService.getOrThrow(
                    'SMTP_USER_USERS_WELCOME_USER',
                  ),
                  clientId: configService.getOrThrow(
                    'SMTP_AUTH_TYPE_CLIENT_ID_USERS_WELCOME_USER',
                  ),
                  clientSecret: configService.getOrThrow(
                    'SMTP_AUTH_TYPE_CLIENT_SECRET_USERS_WELCOME_USER',
                  ),
                  refreshToken: configService.getOrThrow(
                    'SMTP_AUTH_TYPE_REFRESH_TOKEN_USERS_WELCOME_USER',
                  ),
                }
              : undefined,
          },
          defaults: {
            from: configService.getOrThrow('SMTP_USER_USERS_WELCOME_USER'),
          },
        }),
        inject: [ConfigService],
      },
    }),
  ],
})
export class WelcomeUserEmailModule {}
