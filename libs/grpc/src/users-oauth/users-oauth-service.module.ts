import { DynamicModule, Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import * as Joi from 'joi';
import { join } from 'path';
import {
  USERS_OAUTH_PACKAGE_NAME,
  USERS_OAUTH_SERVICE_NAME,
} from './users-oauth';
import { UsersOauthService } from './users-oauth.service';

@Global()
@Module({})
export class UsersOauthServiceModule {
  static forRootAsync({ envFilePath }: { envFilePath: string }): DynamicModule {
    return {
      module: UsersOauthServiceModule,
      imports: [
        ConfigModule.forRoot({
          envFilePath,
          isGlobal: true,
          validationSchema: Joi.object({
            USERS_OAUTH_GRPC_URL: Joi.string().required(),
          }),
        }),
        ClientsModule.registerAsync([
          {
            name: USERS_OAUTH_SERVICE_NAME,
            useFactory: (configService: ConfigService) => ({
              transport: Transport.GRPC,
              options: {
                package: USERS_OAUTH_PACKAGE_NAME,
                protoPath: join(__dirname, '../../../protos/users-oauth.proto'),
                url: configService.getOrThrow('USERS_OAUTH_GRPC_URL'),
              },
            }),
            inject: [ConfigService],
          },
        ]),
      ],
      providers: [UsersOauthService],
      exports: [ClientsModule, UsersOauthService],
    };
  }
}
