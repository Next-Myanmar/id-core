import {
  CorsDeniedException,
  I18nExceptionFilter,
  I18nValidationPipe,
} from '@app/common';
import { USERS_OAUTH_PACKAGE_NAME } from '@app/grpc/users-oauth';
import { ReflectionService } from '@grpc/reflection';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { Logger } from 'nestjs-pino';
import { join } from 'path';
import { UsersModule } from './users.module';

async function bootstrap() {
  const app = await NestFactory.create(UsersModule, { bufferLogs: true });
  const configService = app.get(ConfigService);

  const isDevelopment = process.env.NODE_ENV !== 'prod';

  app.useLogger(app.get(Logger));

  app.useGlobalPipes(
    new I18nValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalFilters(new I18nExceptionFilter());

  const grpcUrlUsers = `${configService.getOrThrow('GRPC_HOST_USERS_OAUTH')}:${configService.getOrThrow('GRPC_PORT_USERS_OAUTH')}`;

  app.connectMicroservice(
    {
      transport: Transport.GRPC,
      options: {
        package: USERS_OAUTH_PACKAGE_NAME,
        protoPath: join(__dirname, '../../../protos/users-oauth.proto'),
        url: grpcUrlUsers,
        ...(isDevelopment
          ? {
              onLoadPackageDefinition: (pkg: any, server: any) => {
                new ReflectionService(pkg).addToServer(server);
              },
            }
          : {}),
      },
    },
    { inheritAppConfig: true },
  );

  await app.startAllMicroservices();

  app.enableShutdownHooks();

  const allowedOrigins = (configService.get('ALLOWED_ORIGINS_USERS') || '')
    .split(',')
    .map((origin: string) => origin.trim());

  const corsOptions: CorsOptions = {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new CorsDeniedException(origin));
      }
    },
    methods: 'GET,POST,OPTIONS',
    credentials: false,
  };

  app.enableCors(corsOptions);

  await app.listen(configService.getOrThrow('HTTP_PORT_USERS'));
}
bootstrap();
