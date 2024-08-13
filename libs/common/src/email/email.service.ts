import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { I18nContext } from 'nestjs-i18n';
import { join } from 'path';
import { EmailOptions } from './email-options.interface';
import { I18nEmailSubject } from './i18n-email-subject.interface';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly mailService: MailerService,
  ) {}

  async sendEmail(options: EmailOptions): Promise<void> {
    const i18n = I18nContext.current();
    const lang = i18n.lang;
    let subject: string;

    if (typeof options.subject === 'string') {
      subject = options.subject;
    } else {
      const { key, args }: I18nEmailSubject = options.subject;

      subject = i18n.t(key, { lang, args });
    }

    const isSendEmail = this.config
      .get<string>('SEND_EMAIL', 'true')
      .toBoolean();

    if (isSendEmail) {
      await this.mailService.sendMail({
        ...options,
        subject,
        template: join(lang, options.template),
      });
    } else {
      this.logger.debug(`Subject: ${subject}`);
      this.logger.debug(`To: ${options.to}`);
      this.logger.debug(`Template: ${options.template}`);
      this.logger.debug(`Context: ${JSON.stringify(options.context)}`);
    }
  }
}
