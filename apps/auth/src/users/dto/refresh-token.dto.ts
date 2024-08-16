import { i18nValidationMessage } from '@app/common';
import { IsNotEmpty } from 'class-validator';

export class RefreshTokenDto {
  @IsNotEmpty({
    message: i18nValidationMessage({
      property: 'property.RefreshToken',
      message: 'validation.NOT_EMPTY',
    }),
  })
  refreshToken: string;
}
