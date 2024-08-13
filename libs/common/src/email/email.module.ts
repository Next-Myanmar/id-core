import { MailerModule, MailerService } from '@nestjs-modules/mailer';
import { EjsAdapter } from '@nestjs-modules/mailer/dist/adapters/ejs.adapter';
import { MailerAsyncOptions } from '@nestjs-modules/mailer/dist/interfaces/mailer-async-options.interface';
import { DynamicModule, Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { EmailService } from './email.service';

@Global()
@Module({})
export class EmailModule {
  static forRootAsync(options: {
    name: string;
    mailerOptions: MailerAsyncOptions;
  }): DynamicModule {
    const mailerProvider = {
      provide: `${options.name}`,
      useFactory: async (...args: any[]) => {
        const factoryOptions = await options.mailerOptions.useFactory(...args);
        delete options.mailerOptions.useFactory;

        return {
          template: {
            dir: join(__dirname, '..', '../../email-templates'),
            adapter: new EjsAdapter(),
            options: {
              strict: false,
            },
          },
          ...factoryOptions,
        };
      },
      inject: options.mailerOptions.inject || [],
    };

    return {
      module: EmailModule,
      imports: [
        MailerModule.forRootAsync({
          ...options.mailerOptions,
          useFactory: mailerProvider.useFactory,
          inject: mailerProvider.inject || [],
        }),
      ],
      providers: [
        {
          provide: mailerProvider.provide,
          useFactory: (config: ConfigService, mailerService: MailerService) => {
            return new EmailService(config, mailerService);
          },
          inject: [ConfigService, MailerService],
        },
      ],
      exports: [mailerProvider.provide],
    };
  }
}
