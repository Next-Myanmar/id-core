import { i18nValidationMessage } from '@app/common';
import { Field, ID, InputType } from '@nestjs/graphql';
import { IsNotEmpty } from 'class-validator';

@InputType()
export class GetDeviceDto {
  @Field(() => ID)
  @IsNotEmpty({
    message: i18nValidationMessage({
      property: 'property.DeviceId',
      message: 'validation.NOT_EMPTY',
    }),
  })
  deviceId: string;
}
