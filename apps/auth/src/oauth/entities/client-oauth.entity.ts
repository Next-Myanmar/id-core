import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
class ClientOauthEntity {
  @Field(() => ID)
  id: string;

  @Field()
  clientId: string;

  @Field()
  clientName: string;

  redirectUri: string;

  grants: 
}
