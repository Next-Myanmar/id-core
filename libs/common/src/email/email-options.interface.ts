import { I18nEmailSubject } from './i18n-email-subject.interface';

export interface EmailOptions {
  to: string;
  subject: string | I18nEmailSubject;
  template: string;
  context?: {
    [name: string]: any;
  };
}
