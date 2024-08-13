import { DynamicModule, Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import * as Joi from 'joi';
import { NOTIFICATIONS_USERS_SERVERS_NAME } from './constants';

@Global()
@Module({})
export class UsersNotificationsModule {
  static forRootAsync({ envFilePath }: { envFilePath: string }): DynamicModule {
    return {
      module: UsersNotificationsModule,
      imports: [
        ConfigModule.forRoot({
          envFilePath,
          isGlobal: true,
          validationSchema: Joi.object({
            RMQ_USER_USERS_NOTIFICATIONS: Joi.string().required(),
            RMQ_PASSWORD_USERS_NOTIFICATIONS: Joi.string().required(),
            RMQ_HOST_USERS_NOTIFICATIONS: Joi.string().required(),
            RMQ_PORT_USERS_NOTIFICATIONS: Joi.number().required(),
            RMQ_QUEUE_USERS_NOTIFICATIONS: Joi.string().required(),
          }),
        }),
        ClientsModule.registerAsync([
          {
            name: NOTIFICATIONS_USERS_SERVERS_NAME,
            useFactory: async (configService: ConfigService) => ({
              transport: Transport.RMQ,
              options: {
                urls: [
                  `amqp://${configService.getOrThrow('RMQ_USER_USERS_NOTIFICATIONS')}:${configService.getOrThrow('RMQ_PASSWORD_USERS_NOTIFICATIONS')}@${configService.getOrThrow('RMQ_HOST_USERS_NOTIFICATIONS')}:${configService.getOrThrow<number>('RMQ_PORT_USERS_NOTIFICATIONS')}`,
                ],
                queue: configService.getOrThrow(
                  'RMQ_QUEUE_USERS_NOTIFICATIONS',
                ),
                queueOptions: {
                  durable: false,
                },
              },
            }),
            inject: [ConfigService],
          },
        ]),
      ],
      exports: [ClientsModule],
    };
  }
}
