import { I18nExceptionFilter, I18nValidationPipe } from '@app/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { UsersModule } from './users.module';

async function bootstrap() {
  const app = await NestFactory.create(UsersModule, { bufferLogs: true });
  const configService = app.get(ConfigService);

  app.useLogger(app.get(Logger));

  app.useGlobalPipes(
    new I18nValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalFilters(new I18nExceptionFilter());

  app.enableShutdownHooks();

  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
  });

  await app.listen(configService.getOrThrow('HTTP_PORT_USERS'));
}
bootstrap();
