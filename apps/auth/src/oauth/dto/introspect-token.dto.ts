import { i18nValidationMessage } from '@app/common';
import { Optional } from '@nestjs/common';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { TokenTypeHint } from '../enums/token-type-hint.enum';

export class IntrospectTokenDto {
  @IsNotEmpty({
    message: i18nValidationMessage({
      property: 'property.token',
      message: 'validation.NOT_EMPTY',
    }),
  })
  token: string;

  @Optional()
  @IsEnum(TokenTypeHint, {
    message: i18nValidationMessage({
      property: 'property.token_type_hint',
      message: 'validation.INVALID',
    }),
  })
  token_type_hint?: TokenTypeHint;

  @IsNotEmpty({
    message: i18nValidationMessage({
      property: 'property.client_id',
      message: 'validation.NOT_EMPTY',
    }),
  })
  client_id: string;

  @IsNotEmpty({
    message: i18nValidationMessage({
      property: 'property.client_secret',
      message: 'validation.NOT_EMPTY',
    }),
  })
  client_secret: string;
}
