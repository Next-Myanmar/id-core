import { I18nExceptionFilter, I18nValidationPipe } from '@app/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Logger } from 'nestjs-pino';
import { join } from 'path';
import { NotificationsModule } from './notifications.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(
    NotificationsModule,
    { bufferLogs: true },
  );
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

  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.setBaseViewsDir(join(__dirname, '..', 'email-templates'));
  app.setViewEngine('ejs');

  const usersRmqUrl = `amqp://${configService.getOrThrow('RMQ_USER_USERS')}:${configService.getOrThrow('RMQ_PASSWORD_USERS')}@${configService.getOrThrow('RMQ_HOST_USERS')}:${configService.getOrThrow<number>('RMQ_PORT_USERS')}`;

  app.connectMicroservice({
    transport: Transport.RMQ,
    options: {
      urls: [usersRmqUrl],
      queue: configService.getOrThrow('RMQ_QUEUE_USERS'),
      queueOptions: {
        durable: false,
      },
    },
  });

  await app.startAllMicroservices();
  await app.listen(configService.getOrThrow<number>('HTTP_PORT_NOTIFICATIONS'));
}
bootstrap();
