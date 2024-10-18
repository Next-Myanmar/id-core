import { DynamicModule, Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import * as Joi from 'joi';
import { join } from 'path';
import { AUTH_OAUTH_PACKAGE_NAME, AUTH_OAUTH_SERVICE_NAME } from './auth-oauth';
import { AuthOauthService } from './auth-oauth.service';

@Global()
@Module({})
export class AuthOauthServiceModule {
  static forRootAsync({ envFilePath }: { envFilePath: string }): DynamicModule {
    return {
      module: AuthOauthServiceModule,
      imports: [
        ConfigModule.forRoot({
          envFilePath,
          isGlobal: true,
          validationSchema: Joi.object({
            AUTH_USERS_GRPC_URL: Joi.string().required(),
          }),
        }),
        ClientsModule.registerAsync([
          {
            name: AUTH_OAUTH_SERVICE_NAME,
            useFactory: (configService: ConfigService) => ({
              transport: Transport.GRPC,
              options: {
                package: AUTH_OAUTH_PACKAGE_NAME,
                protoPath: join(__dirname, '../../../protos/auth-oauth.proto'),
                url: configService.getOrThrow('AUTH_OAUTH_GRPC_URL'),
              },
            }),
            inject: [ConfigService],
          },
        ]),
      ],
      providers: [AuthOauthService],
      exports: [ClientsModule, AuthOauthService],
    };
  }
}
