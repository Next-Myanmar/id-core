import { DynamicModule, Module } from '@nestjs/common';
import {
  HeaderResolver,
  I18nOptionResolver,
  I18nModule as NestI18nModule,
} from 'nestjs-i18n';
import { join } from 'path';

@Module({
  imports: [
    NestI18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: {
        path: join(__dirname, '../../../i18n/'),
        watch: true,
      },
      resolvers: [new HeaderResolver(['x-lang'])],
    }),
  ],
})
export class I18nModule {
  static forRoot(options: { resolvers?: I18nOptionResolver[] }): DynamicModule {
    return {
      module: I18nModule,
      imports: [
        NestI18nModule.forRoot({
          fallbackLanguage: 'en',
          loaderOptions: {
            path: join(__dirname, '../../../i18n/'),
            watch: true,
          },
          resolvers: [new HeaderResolver(['x-lang'])],
          ...options,
        }),
      ],
      exports: [NestI18nModule],
    };
  }
}
