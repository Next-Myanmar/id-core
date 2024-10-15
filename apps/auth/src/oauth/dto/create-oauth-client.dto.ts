import { i18nValidationMessage, IsURI } from '@app/common';
import { Grant } from '@app/prisma/auth';
import { Field, InputType } from '@nestjs/graphql';
import { IsEnum, IsNotEmpty } from 'class-validator';

@InputType()
export class CreateOauthClientDto {
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

  @Field()
  @IsEnum(Grant, {
    each: true,
    message: i18nValidationMessage({
      property: 'property.Grants',
      message: 'validation.INVALID',
    }),
  })
  grants: Grant[];
}
