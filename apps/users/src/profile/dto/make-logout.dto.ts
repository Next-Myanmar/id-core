import { i18nValidationMessage } from '@app/common';
import { Field, InputType } from '@nestjs/graphql';
import { ArrayNotEmpty, IsArray, IsNotEmpty } from 'class-validator';

@InputType()
export class MakeLogoutDto {
  @Field(() => [String])
  @IsArray()
  @ArrayNotEmpty({
    message: i18nValidationMessage({
      property: 'property.DeviceId',
      message: 'validation.NOT_EMPTY',
    }),
  })
  @IsNotEmpty({
    each: true,
    message: i18nValidationMessage({
      property: 'property.DeviceId',
      message: 'validation.NOT_EMPTY_EACH',
    }),
  })
  deviceIds: string[];
}
