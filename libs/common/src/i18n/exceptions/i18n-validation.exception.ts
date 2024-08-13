import { BadRequestException } from '@nestjs/common';
import { I18nValidationError } from '../interfaces';

export class I18nValidationException extends BadRequestException {
  constructor(...errors: I18nValidationError[]) {
    super(errors);
  }

  static create(...errors: I18nValidationError[]): I18nValidationException {
    return new I18nValidationException(...errors);
  }
}
