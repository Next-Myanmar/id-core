import { EmailService } from '@app/common';
import { SendVerifyLoginEmailDto } from '@app/common/rmq/notifications/users';
import { Inject, Injectable } from '@nestjs/common';
import { SEND_VERIFY_LOGIN_EMAIL_PROVIDER } from '../email-modules/verify-login-email.module';

@Injectable()
export class SendVerifyLoginEmailService {
  constructor(
    @Inject(SEND_VERIFY_LOGIN_EMAIL_PROVIDER)
    private readonly email: EmailService,
  ) {}

  async sendVerifyLoginEmail(
    sendVerifyLoginEmailDto: SendVerifyLoginEmailDto,
  ): Promise<void> {
    await this.email.sendEmail({
      to: sendVerifyLoginEmailDto.recipient,
      subject: { key: 'email.users.subject.verify-login' },
      template: './users/verify-login',
      context: {
        firstName: sendVerifyLoginEmailDto.firstName,
        code: sendVerifyLoginEmailDto.code,
      },
    });
  }
}
