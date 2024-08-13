import {
  ArgumentMetadata,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';
import { I18nContext, I18nValidationPipeOptions } from 'nestjs-i18n';
import { I18nValidationException } from '../exceptions/i18n-validation.exception';
import { validationErrorToI18n } from '../utils';

export class I18nValidationPipe extends ValidationPipe {
  constructor(options?: I18nValidationPipeOptions) {
    super({
      ...options,
      exceptionFactory: (errors: ValidationError[]) => {
        return new I18nValidationException(
          ...errors.map((error) => {
            return validationErrorToI18n(error);
          }),
        );
      },
    });
  }

  protected toValidate(metadata: ArgumentMetadata): boolean {
    const { metatype } = metadata;
    return metatype !== I18nContext && super.toValidate(metadata);
  }
}
