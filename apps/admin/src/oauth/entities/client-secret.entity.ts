import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ClientSecretEntity {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  secret: string;
}
