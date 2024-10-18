import { i18nValidationMessage } from '@app/common';
import { IsEnum, IsNotEmpty, Matches, ValidateIf } from 'class-validator';
import { Grant } from '../../enums/grant.enum';

export class TokenDto {
  @IsEnum(Grant, {
    message: i18nValidationMessage({
      property: 'property.grant_type',
      message: 'validation.INVALID',
    }),
  })
  grant_type: Grant;

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

  @ValidateIf((o) => o.grant_type === Grant.AuthorizationCode)
  @IsNotEmpty({
    message: i18nValidationMessage({
      property: 'property.code',
      message: 'validation.NOT_EMPTY',
    }),
  })
  code: string;

  @ValidateIf((o) => o.grant_type === Grant.AuthorizationCode)
  @Matches(/^[A-Za-z0-9-._~]{43,128}$/, {
    message: i18nValidationMessage({
      property: 'property.code_verifier',
      message: 'validation.INVALID',
    }),
  })
  @IsNotEmpty({
    message: i18nValidationMessage({
      property: 'property.code_verifier',
      message: 'validation.NOT_EMPTY',
    }),
  })
  code_verifier: string;

  @ValidateIf((o) => o.grant_type === Grant.RefreshToken)
  @IsNotEmpty({
    message: i18nValidationMessage({
      property: 'property.refresh_token',
      message: 'validation.NOT_EMPTY',
    }),
  })
  refresh_token: string;
}
