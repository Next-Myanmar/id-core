import { i18nValidationMessage, IsMinDate, IsNotFutureDate } from '@app/common';
import { Field, InputType } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import { IsDate, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { Gender } from '../../enums/gender.enum';

const minDate = () => {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 200);
  return date;
};

@InputType()
export class UpdatePersonalDetailsDto {
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
  @IsNotFutureDate({
    message: i18nValidationMessage({
      property: 'property.DateOfBirth',
      message: 'validation.FUTURE_DATE',
    }),
  })
  @IsMinDate(minDate(), {
    message: i18nValidationMessage({
      property: 'property.DateOfBirth',
      message: 'validation.MIN_DATE',
      args: { minDate: minDate().toISOString().split('T')[0] },
    }),
  })
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
