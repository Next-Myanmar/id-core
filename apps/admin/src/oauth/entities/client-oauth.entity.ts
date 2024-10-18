import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Grant } from '../enums/grant.enum';
import { ClientSecretEntity } from './client-secret.entity';

@ObjectType()
export class ClientOauthEntity {
  @Field(() => ID)
  id: string;

  @Field()
  clientId: string;

  @Field()
  clientName: string;

  @Field()
  redirectUri: string;

  @Field(() => [Grant])
  grants: Grant[];

  @Field(() => [ClientSecretEntity])
  clientSecrets: ClientSecretEntity[];
}
