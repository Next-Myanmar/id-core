import { i18nValidationMessage } from '@app/common';
import { Field, InputType } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import { IsDate, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { Gender } from '../../enums/gender.enum';

@InputType()
export class UpdateProfileDto {
  @Field({ nullable: true })
  @IsOptional()
  @Transform(({ value }) => (value === null ? '' : value))
  @IsNotEmpty({
    message: i18nValidationMessage({
      property: 'property.FirstName',
      message: 'validation.NOT_EMPTY',
    }),
  })
  firstName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsNotEmpty({
    message: i18nValidationMessage({
      property: 'property.LastName',
      message: 'validation.NOT_EMPTY',
    }),
  })
  lastName?: string;

  @Field(() => Date, { nullable: true })
  @IsOptional()
  @IsDate({
    message: i18nValidationMessage({
      property: 'property.DateOfBirth',
      message: 'validation.INVALID',
    }),
  })
  dateOfBirth?: Date;

  @Field(() => Gender, { nullable: true })
  @IsOptional()
  @Transform(({ value }) => (value === null ? Gender.NotSpecified : value))
  @IsEnum(Gender, {
    message: i18nValidationMessage({
      property: 'property.Gender',
      message: 'validation.INVALID',
    }),
  })
  gender?: Gender;
}
