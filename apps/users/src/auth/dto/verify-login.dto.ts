import { i18nValidationMessage, NumberLength } from '@app/common';

export class VerifyLoginDto {
  @NumberLength(6, 6, {
    message: i18nValidationMessage({
      property: 'property.Code',
      message: 'validation.INVALID',
    }),
  })
  code: number;
}
