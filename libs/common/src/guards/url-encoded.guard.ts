import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { I18nValidationException, i18nValidationMessage } from '../i18n';

@Injectable()
export class UrlEncodedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const type: string = context.getType();
    if (type === 'http') {
      const req = context.switchToHttp().getRequest();

      if (req.is('application/x-www-form-urlencoded')) {
        return true;
      }
    }

    throw I18nValidationException.create({
      message: i18nValidationMessage({
        message: 'exception.REQUIRED_HTTP_FORM_URL_ENCODED',
      }),
    });
  }
}
