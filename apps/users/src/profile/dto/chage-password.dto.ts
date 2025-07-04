import { i18nValidationMessage } from '@app/common';
import { Field, InputType } from '@nestjs/graphql';
import { IsBoolean, IsNotEmpty, IsStrongPassword } from 'class-validator';

@InputType()
export class ChangePasswordDto {
  @Field()
  @IsNotEmpty({
    message: i18nValidationMessage({
      property: 'property.Password',
      message: 'validation.NOT_EMPTY',
    }),
  })
  currentPassword: string;

  @Field()
  @IsStrongPassword(
    {},
    {
      message: i18nValidationMessage({
        message: 'validation.INVALID_PASSWORD',
      }),
    },
  )
  newPassword: string;

  @Field(() => Boolean)
  @IsBoolean({
    message: i18nValidationMessage({
      property: 'property.Password',
      message: 'validation.BOOLEAN',
    }),
  })
  makeLogout: boolean;
}
