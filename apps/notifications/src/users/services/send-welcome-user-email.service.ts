import { EmailService } from '@app/common';
import { SendWelcomeUserEmailDto } from '@app/rmq/notifications-users';
import { Inject, Injectable } from '@nestjs/common';
import { SEND_WELCOME_USER_EMAIL_PROVIDER } from '../email-modules/welcome-user-email.module';

@Injectable()
export class SendWelcomeUserEmailService {
  constructor(
    @Inject(SEND_WELCOME_USER_EMAIL_PROVIDER)
    private readonly email: EmailService,
  ) {}

  async sendWelcomeUserEmail(
    sendWelcomeUserEmailDto: SendWelcomeUserEmailDto,
  ): Promise<void> {
    await this.email.sendEmail({
      to: sendWelcomeUserEmailDto.recipient,
      subject: { key: 'email.users.subject.welcome-user' },
      template: './users/welcome-user',
      context: {
        firstName: sendWelcomeUserEmailDto.firstName,
      },
    });
  }
}
