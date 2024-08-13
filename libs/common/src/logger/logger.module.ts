import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    PinoLoggerModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const isDevelopment = process.env.NODE_ENV === 'development';

        return {
          pinoHttp: {
            transport: isDevelopment
              ? {
                  target: 'pino-pretty',
                  options: {
                    singleLine: true,
                    colorize: true,
                  },
                }
              : undefined,
            level: configService.get<string>('LOG_LEVEL') || 'info',
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [],
  exports: [],
})
export class LoggerModule {}
