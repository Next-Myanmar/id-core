import { i18nValidationMessage } from '@app/common';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsStrongPassword,
} from 'class-validator';

export class SignupDto {
  @IsEmail(
    {},
    {
      message: i18nValidationMessage({
        property: 'property.Email',
        message: 'validation.INVALID',
      }),
    },
  )
  email: string;

  @IsStrongPassword(
    {},
    {
      message: i18nValidationMessage({
        message: 'validation.INVALID_PASSWORD',
      }),
    },
  )
  password: string;

  @IsNotEmpty({
    message: i18nValidationMessage({
      property: 'property.FirstName',
      message: 'validation.NOT_EMPTY',
    }),
  })
  firstName: string;

  @IsOptional()
  @IsNotEmpty({
    message: i18nValidationMessage({
      property: 'property.LastName',
      message: 'validation.NOT_EMPTY',
    }),
  })
  lastName?: string;
}
