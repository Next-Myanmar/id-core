import { I18nExceptionFilter, I18nValidationPipe } from '@app/common';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { AdminModule } from './admin.module';

async function bootstrap() {
  const app = await NestFactory.create(AdminModule, { bufferLogs: true });
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

  await app.listen(configService.getOrThrow('HTTP_PORT_ADMIN'));
}
bootstrap();
