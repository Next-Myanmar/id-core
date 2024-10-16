import { EmailService } from '@app/common';
import { SendActivateUserEmailDto } from '@app/rmq/notifications-users';
import { Inject, Injectable } from '@nestjs/common';
import { SEND_ACTIVATE_USER_EMAIL_PROVIDER } from '../email-modules/activate-user-email.module';

@Injectable()
export class SendActivateUserEmailService {
  constructor(
    @Inject(SEND_ACTIVATE_USER_EMAIL_PROVIDER)
    private readonly email: EmailService,
  ) {}

  async sendActivateUserEmail(
    sendActivateUserEmailDto: SendActivateUserEmailDto,
  ): Promise<void> {
    await this.email.sendEmail({
      to: sendActivateUserEmailDto.recipient,
      subject: { key: 'email.users.subject.activate-user' },
      template: './users/activate-user',
      context: {
        firstName: sendActivateUserEmailDto.firstName,
        code: sendActivateUserEmailDto.code,
      },
    });
  }
}
