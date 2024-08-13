import { ClientProxy, RmqRecordBuilder } from '@nestjs/microservices';
import { I18nContext } from 'nestjs-i18n';

export async function emitEmail(
  client: ClientProxy,
  eventName: string,
  data: any,
  lang?: string,
): Promise<void> {
  if (!lang) {
    lang = I18nContext.current().lang;
  }

  const record = new RmqRecordBuilder(data)
    .setOptions({
      headers: {
        ['x-lang']: lang,
      },
    })
    .build();

  client.emit(eventName, record).subscribe(() => {});
}
