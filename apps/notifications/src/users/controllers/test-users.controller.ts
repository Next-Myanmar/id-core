import {
  NOTIFICATIONS_USERS_SERVERS_NAME,
  SEND_ACTIVATE_USER_EMAIL,
} from '@app/common/rmq/notifications/users';
import { Body, Controller, Inject, Post } from '@nestjs/common';
import { ClientProxy, RmqRecordBuilder } from '@nestjs/microservices';
import { I18nContext } from 'nestjs-i18n';

@Controller('test/users')
export class TestUsersController {
  constructor(
    @Inject(NOTIFICATIONS_USERS_SERVERS_NAME)
    private readonly client: ClientProxy,
  ) {}

  @Post(SEND_ACTIVATE_USER_EMAIL)
  async sendActivateUserEmail(@Body() data: any): Promise<string> {
    const record = new RmqRecordBuilder(data)
      .setOptions({
        headers: {
          ['x-lang']: I18nContext.current().lang,
        },
      })
      .build();

    this.client.emit(SEND_ACTIVATE_USER_EMAIL, record);

    return 'Successfully Send Activate User Email';
  }
}
