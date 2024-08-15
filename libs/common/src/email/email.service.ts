import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';
import { I18nContext } from 'nestjs-i18n';
import { join } from 'path';
import { EmailOptions } from './email-options.interface';
import { I18nEmailSubject } from './i18n-email-subject.interface';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly mailService: MailerService) {}

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

    await this.mailService.sendMail({
      ...options,
      subject,
      template: join(lang, options.template),
    });
  }
}
