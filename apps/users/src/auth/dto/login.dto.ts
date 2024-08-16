import { i18nValidationMessage } from '@app/common';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class LoginDto {
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

  @IsNotEmpty({
    message: i18nValidationMessage({
      property: 'property.Password',
      message: 'validation.NOT_EMPTY',
    }),
  })
  password: string;
}
