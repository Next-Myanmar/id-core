import { CorsDeniedException, I18nExceptionFilter, I18nValidationPipe } from '@app/common';
import { AUTH_OAUTH_PACKAGE_NAME } from '@app/grpc/auth-oauth';
import { AUTH_USERS_PACKAGE_NAME } from '@app/grpc/auth-users';
import { ReflectionService } from '@grpc/reflection';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { Logger } from 'nestjs-pino';
import { join } from 'path';
import { AuthModule } from './auth.module';
import { CorsService } from './services/cors.service';

async function bootstrap() {
  const app = await NestFactory.create(AuthModule, { bufferLogs: true });
  const configService = app.get(ConfigService);

  const corsService = app.get(CorsService);

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

  const authUsersGrpcUrl = `${configService.getOrThrow('GRPC_HOST_AUTH_USERS')}:${configService.getOrThrow('GRPC_PORT_AUTH_USERS')}`;

  app.connectMicroservice(
    {
      transport: Transport.GRPC,
      options: {
        package: AUTH_USERS_PACKAGE_NAME,
        protoPath: join(__dirname, '../../../protos/auth-users.proto'),
        url: authUsersGrpcUrl,
        ...(isDevelopment
          ? {
              onLoadPackageDefinition: (pkg: any, server: any) => {
                return new ReflectionService(pkg).addToServer(server);
              },
            }
          : {}),
      },
    },
    { inheritAppConfig: true },
  );

  const authOauthGrpcUrl = `${configService.getOrThrow('GRPC_HOST_AUTH_OAUTH')}:${configService.getOrThrow('GRPC_PORT_AUTH_OAUTH')}`;

  app.connectMicroservice(
    {
      transport: Transport.GRPC,
      options: {
        package: AUTH_OAUTH_PACKAGE_NAME,
        protoPath: join(__dirname, '../../../protos/auth-oauth.proto'),
        url: authOauthGrpcUrl,
        ...(isDevelopment
          ? {
              onLoadPackageDefinition: (pkg: any, server: any) => {
                return new ReflectionService(pkg).addToServer(server);
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
    origin: async (origin, callback) => {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        (await corsService.isAllow(origin))
      ) {
        callback(null, true);
      } else {
        callback(new CorsDeniedException(origin));
      }
    },
    methods: 'GET,POST,OPTIONS',
    credentials: false,
  };

  app.enableCors(corsOptions);

  await app.listen(configService.getOrThrow('HTTP_PORT_AUTH'));
}
bootstrap();
