import { emitEmail } from '@app/common';
import {
  NOTIFICATIONS_USERS_SERVERS_NAME,
  SEND_ACTIVATE_USER_EMAIL,
} from '@app/common/rmq/notifications/users';
import { Body, Controller, Inject, Post } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Controller('test/users')
export class TestUsersController {
  constructor(
    @Inject(NOTIFICATIONS_USERS_SERVERS_NAME)
    private readonly client: ClientProxy,
  ) {}

  @Post(SEND_ACTIVATE_USER_EMAIL)
  async sendActivateUserEmail(@Body() data: any): Promise<string> {
    await emitEmail(this.client, SEND_ACTIVATE_USER_EMAIL, data);

    return 'Successfully Send Activate User Email';
  }
}
