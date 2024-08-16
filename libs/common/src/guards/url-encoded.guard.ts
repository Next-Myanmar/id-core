import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { I18nValidationException, i18nValidationMessage } from '../i18n';
import { getRequestFromContext } from '../utils';

@Injectable()
export class UrlEncodedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req: Request = getRequestFromContext(context);
    if (req.is('application/x-www-form-urlencoded')) {
      return true;
    }

    throw I18nValidationException.create({
      message: i18nValidationMessage({
        message: 'exception.REQUIRED_HTTP_FORM_URL_ENCODED',
      }),
    });
  }
}
