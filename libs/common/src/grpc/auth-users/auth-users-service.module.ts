import { DynamicModule, Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import * as Joi from 'joi';
import { join } from 'path';
import { AUTH_USERS_PACKAGE_NAME, AUTH_USERS_SERVICE_NAME } from './auth-users';
import { AuthUsersService } from './auth-users.service';

@Global()
@Module({})
export class AuthUsersServiceModule {
  static forRootAsync({ envFilePath }: { envFilePath: string }): DynamicModule {
    return {
      module: AuthUsersServiceModule,
      imports: [
        ConfigModule.forRoot({
          envFilePath,
          isGlobal: true,
          validationSchema: Joi.object({
            AUTH_GRPC_URL: Joi.string().required(),
          }),
        }),
        ClientsModule.registerAsync([
          {
            name: AUTH_USERS_SERVICE_NAME,
            useFactory: (configService: ConfigService) => ({
              transport: Transport.GRPC,
              options: {
                package: AUTH_USERS_PACKAGE_NAME,
                protoPath: join(__dirname, '../../../protos/auth-users.proto'),
                url: configService.getOrThrow('AUTH_GRPC_URL'),
              },
            }),
            inject: [ConfigService],
          },
        ]),
      ],
      providers: [AuthUsersService],
      exports: [ClientsModule, AuthUsersService],
    };
  }
}
