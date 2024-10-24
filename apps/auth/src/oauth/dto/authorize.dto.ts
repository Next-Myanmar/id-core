import { i18nValidationMessage, IsURI } from '@app/common';
import { Transform } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsNotEmpty,
  ValidateIf,
} from 'class-validator';
import { CodeChallengeMethod } from '../enums/code-challenge-method.enum';
import { ResponseType } from '../enums/response-type.enum';
import { Scope } from '../enums/scope.enum';

export class AuthorizeDto {
  @IsEnum(ResponseType, {
    message: i18nValidationMessage({
      property: 'property.response_type',
      message: 'validation.INVALID',
    }),
  })
  response_type: ResponseType;

  @IsNotEmpty({
    message: i18nValidationMessage({
      property: 'property.client_id',
      message: 'validation.NOT_EMPTY',
    }),
  })
  client_id: string;

  @IsURI({
    message: i18nValidationMessage({
      property: 'property.redirect_uri',
      message: 'validation.INVALID',
    }),
  })
  redirect_uri: string;

  @ValidateIf((o) => o.response_type === ResponseType.code)
  @IsNotEmpty({
    message: i18nValidationMessage({
      property: 'property.code_challenge',
      message: 'validation.NOT_EMPTY',
    }),
  })
  code_challenge: string;

  @ValidateIf((o) => o.response_type === ResponseType.code)
  @IsEnum(CodeChallengeMethod, {
    message: i18nValidationMessage({
      property: 'property.code_challenge_method',
      message: 'validation.INVALID',
    }),
  })
  code_challenge_method: CodeChallengeMethod;

  @ValidateIf((o) => o.response_type === ResponseType.code)
  @Transform(({ value }) =>
    value ? value.split(' ').map((scope: Scope) => scope as Scope) : [],
  )
  @IsArray({
    message: i18nValidationMessage({
      property: 'property.scopes',
      message: 'validation.INVALID',
    }),
  })
  @ArrayNotEmpty({
    message: i18nValidationMessage({
      property: 'property.scopes',
      message: 'validation.INVALID',
    }),
  })
  @IsEnum(Scope, {
    each: true,
    message: i18nValidationMessage({
      property: 'property.scopes',
      message: 'validation.INVALID',
    }),
  })
  scope: Scope[];
}
