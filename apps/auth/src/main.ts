import { I18nExceptionFilter, I18nValidationPipe } from '@app/common';
import { AUTH_USERS_PACKAGE_NAME } from '@app/grpc/auth-users';
import { ReflectionService } from '@grpc/reflection';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { Logger } from 'nestjs-pino';
import { join } from 'path';
import { AuthModule } from './auth.module';

async function bootstrap() {
  const app = await NestFactory.create(AuthModule, { bufferLogs: true });
  const configService = app.get(ConfigService);

  const isDevelopment = process.env.NODE_ENV === 'development';

  app.useLogger(app.get(Logger));

  app.useGlobalPipes(
    new I18nValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalFilters(new I18nExceptionFilter());

  const grpcUrlUsers = `${configService.getOrThrow('GRPC_HOST_USERS')}:${configService.getOrThrow('GRPC_PORT_USERS')}`;

  app.connectMicroservice(
    {
      transport: Transport.GRPC,
      options: {
        package: AUTH_USERS_PACKAGE_NAME,
        protoPath: join(__dirname, '../../../protos/auth-users.proto'),
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
      if (allowedOrigins.includes(origin) || !origin) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: 'GET,PUT,PATCH,POST,DELETE',
    credentials: false,
  };

  app.enableCors(corsOptions);

  await app.listen(configService.getOrThrow('HTTP_PORT_AUTH'));
}
bootstrap();
