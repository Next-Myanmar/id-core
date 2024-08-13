import { I18nExceptionFilter, I18nValidationPipe } from '@app/common';
import { AUTH_USERS_PACKAGE_NAME } from '@app/common/grpc/auth-users';
import { ReflectionService } from '@grpc/reflection';
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

  app.connectMicroservice(
    {
      transport: Transport.GRPC,
      options: {
        package: AUTH_USERS_PACKAGE_NAME,
        protoPath: join(__dirname, '../../../protos/auth-users.proto'),
        url: configService.getOrThrow('GRPC_URL_USERS'),
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

  await app.listen(configService.getOrThrow('HTTP_PORT_AUTH'));
}
bootstrap();
