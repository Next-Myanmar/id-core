import { i18nValidationMessage, IsURI } from '@app/common';
import { Field, InputType } from '@nestjs/graphql';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { Grant } from '../enums/grant.enum';

@InputType()
export class CreateClientOauthDto {
  @Field()
  @IsNotEmpty({
    message: i18nValidationMessage({
      property: 'property.ClientName',
      message: 'validation.NOT_EMPTY',
    }),
  })
  clientName: string;

  @Field()
  @IsNotEmpty({
    message: i18nValidationMessage({
      property: 'property.ClientSecretName',
      message: 'validation.NOT_EMPTY',
    }),
  })
  clientSecretName: string;

  @Field()
  @IsURI({
    message: i18nValidationMessage({
      property: 'property.RedirectUri',
      message: 'validation.INVALID',
    }),
  })
  redirectUri: string;

  @Field(() => [Grant])
  @IsEnum(Grant, {
    each: true,
    message: i18nValidationMessage({
      property: 'property.Grants',
      message: 'validation.INVALID',
    }),
  })
  grants: Grant[];
}
